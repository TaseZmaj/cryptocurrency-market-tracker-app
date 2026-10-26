package mk.ukim.finki.wp.cryptocurrencyanalysisapp.service.Pipeline;

import lombok.RequiredArgsConstructor;
import mk.ukim.finki.wp.cryptocurrencyanalysisapp.model.DTOs.PipelineDTOs.HistoricalUpdateInfoDTO;
import mk.ukim.finki.wp.cryptocurrencyanalysisapp.model.DTOs.PipelineDTOs.SummaryMetricsDTO;
import mk.ukim.finki.wp.cryptocurrencyanalysisapp.model.MongoDBModels.HistoricalData;
import mk.ukim.finki.wp.cryptocurrencyanalysisapp.model.MongoDBModels.AssetSummary;
import mk.ukim.finki.wp.cryptocurrencyanalysisapp.model.MongoDBModels.Symbol;
import mk.ukim.finki.wp.cryptocurrencyanalysisapp.repository.AssetSummaryRepository;
import mk.ukim.finki.wp.cryptocurrencyanalysisapp.repository.HistoricalDataRepository;
import mk.ukim.finki.wp.cryptocurrencyanalysisapp.utils.ApiFetchingUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Semaphore;

import org.springframework.beans.factory.annotation.Qualifier;

import static mk.ukim.finki.wp.cryptocurrencyanalysisapp.utils.TransformationUtils.transformAssetSummary;
import static mk.ukim.finki.wp.cryptocurrencyanalysisapp.utils.TransformationUtils.transformKlinesToHistoricalData;

@Service
//@RequiredArgsConstructor
public class Filter2 {

    private final AssetSummaryRepository assetSummaryRepository;
    private final HistoricalDataRepository historicalDataRepository;
    private final RestTemplate restTemplate;
    private final ApiFetchingUtils apiFetchingUtils;

    private final Executor executor;

    @Autowired
    public Filter2(AssetSummaryRepository assetSummaryRepository,
                   HistoricalDataRepository historicalDataRepository,
                   RestTemplate restTemplate,
                   ApiFetchingUtils apiFetchingUtils,
                   @Qualifier("filterExecutor") Executor executor) {
        this.assetSummaryRepository = assetSummaryRepository;
        this.historicalDataRepository = historicalDataRepository;
        this.restTemplate = restTemplate;
        this.apiFetchingUtils = apiFetchingUtils;
        this.executor = executor;
    }

    private static final String BINANCE_TICKER_API = "https://api.binance.com/api/v3/ticker/24hr?";
    private static final String BINANCE_KLINE_API = "https://api.binance.com/api/v3/klines";
    private static final String DEFAULT_INTERVAL = "1d";
    private static final int MAX_KLINES_PER_CALL = 1000;
    private static final String DEFAULT_QUOTE_ASSET = "USDT";

    //For multiple threads
    private static final int MAX_CONCURRENT_REQUESTS = 20;
    private final Semaphore semaphore = new Semaphore(MAX_CONCURRENT_REQUESTS);

    public List<HistoricalUpdateInfoDTO> run(List<Symbol> symbols) {
        System.out.println("\n--- Filter 2: Starting historical data check for " + symbols.size() + " symbols. ---");

        List<CompletableFuture<HistoricalUpdateInfoDTO>> futures = new ArrayList<>();

        for (Symbol symbol : symbols) {
            futures.add(CompletableFuture.supplyAsync(
                    () -> checkLastUpdateDateAndLoadIfMissing(symbol),
                    executor
            ));
        }

        // Wait for all futures to complete and collect results
        List<HistoricalUpdateInfoDTO> results = futures.stream()
                .map(CompletableFuture::join)
                .filter(dto -> dto.getLastUpdatedDate() != null) //filters out all DTOs that have last_date=null
                .toList();

        return results;
    }

    /**
     * Check the DB and perform full load if needed.  Runs Multiple threads that all fetch from binance.
     */
    private HistoricalUpdateInfoDTO checkLastUpdateDateAndLoadIfMissing(Symbol symbol) {
        try {
            semaphore.acquire(); // acquire slot before API call
                try {
                    // 24H data is fetched first, so delisted pairs are dropped before their OHLCV data is loaded
                    System.out.println("    -> 24H DATA: Getting data for the last 24h for " + symbol.getSymbol());
                    if (!fetchAdditionalSymbolData(symbol.getId(), symbol.getSymbol())) {
                        // lastDate=null → Filter 3 skips this symbol as well
                        return new HistoricalUpdateInfoDTO(symbol.getId(), symbol.getSymbol(), null);
                    }

                    HistoricalData latestData = historicalDataRepository
                            .findTopBySymbolIdOrderByTimestampDesc(symbol.getId())
                            .orElse(null);

                    Instant lastDate;

                    if (latestData != null) {
                        // We already have data → Filter 3 will continue incrementally,
                        // starting AT the latest candle (it may have been saved mid-day and needs refreshing)
                        lastDate = latestData.getTimestamp();
                    } else {
                        // No data → run full 10-year load
                        System.out.println("  -> Filter 2: No historical data for " + symbol.getSymbol() + " in the Database. ");
                        System.out.println("  -> Filter 2: Initiating FULL 10-year load of OHLCV data.");

                        System.out.println("    -> OHLCV DATA: Getting OHCLV data for the last 10 years for " + symbol.getSymbol());
                        fetchAndSaveFullOhlcvData(symbol.getId(), symbol.getSymbol());

                        lastDate = null; // Filter 3 will know not to increment
                    }

                    return new HistoricalUpdateInfoDTO(
                            symbol.getId(),
                            symbol.getSymbol(),
                            lastDate
                    );

                } catch (Exception ex) {
                    System.err.println("    -> ERROR in Filter 2 for " + symbol.getSymbol() + ": " + ex.getMessage() + "\n");
                    return new HistoricalUpdateInfoDTO(symbol.getId(), symbol.getSymbol(), null);
                } finally {
                    semaphore.release(); // release slot
                }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException(e);
        }
    }

    /**
     * Fetches data about the coin for the last 24H.
     * Returns false if the pair is delisted on Binance (it reports a last price of 0),
     * in which case the coin's summary is removed so it no longer shows up in the coin list.
     */
    private boolean fetchAdditionalSymbolData(String coinId, String binanceSymbol){
        String url = BINANCE_TICKER_API + "symbol=" + binanceSymbol + DEFAULT_QUOTE_ASSET;

        ResponseEntity<SummaryMetricsDTO> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
        );

        SummaryMetricsDTO symbolData24h = response.getBody();

        // Delisted pairs still answer the ticker API, but with every value set to 0
        if (symbolData24h == null || symbolData24h.getLastPrice() == null
                || symbolData24h.getLastPrice().signum() <= 0) {
            System.out.println("    -> Filter 2: Skipping delisted asset (last price is 0 on Binance): " + binanceSymbol);
            assetSummaryRepository.deleteById(coinId); // removes zeroed summaries saved by earlier runs
            return false;
        }

        AssetSummary assetSummary = transformAssetSummary(coinId, symbolData24h);

        assetSummaryRepository.save(assetSummary);
        System.out.println("    -> 24H DATA: LOADED SUCCESSFULLY");
        return true;
    }

    /**
     * Full 10-year OHLCV fetch from Binance.
     */
    private void fetchAndSaveFullOhlcvData(String coinId, String binanceSymbol) {
        final long now = Instant.now().toEpochMilli();

        // 10 years back using ZonedDateTime (Instant does not allow years)
        long start = Instant.now()
                .atZone(java.time.ZoneOffset.UTC)
                .minusYears(10)
                .toInstant()
                .toEpochMilli();

        List<HistoricalData> allData = new ArrayList<>();
        int totalSaved = 0;
        int batchCount = 0;

        while (true) {

            String url = String.format(
                    "%s?symbol=%s&interval=%s&startTime=%d&limit=%d",
                    BINANCE_KLINE_API,
                    binanceSymbol + DEFAULT_QUOTE_ASSET,
                    DEFAULT_INTERVAL,
                    start,
                    MAX_KLINES_PER_CALL
            );

            //result from ""https://api.binance.com/api/v3/klines""
            List<List<Object>> klines = apiFetchingUtils.callBinanceWithRetry(url);
            if (klines == null || klines.isEmpty()) {
                System.out.println("      -> FULL LOAD: No more klines for " + binanceSymbol + ". Done.");
                break;
            }

            // Convert klines to HistoricalData
            List<HistoricalData> batch = transformKlinesToHistoricalData(coinId, klines);

            // Save this batch to DB
            historicalDataRepository.saveAll(batch);
            batchCount++;
            totalSaved += batch.size();

            // Logging
            System.out.println("      Saved batch #" + batchCount + " (" + batch.size() + " entries) for " + binanceSymbol);

            // Move cursor to next candle after last returned openTime
            long lastOpenTime = Long.parseLong(klines.get(klines.size() - 1).get(0).toString());
            long nextStart = lastOpenTime + 1;

            if (nextStart >= now) {
                System.out.println("  -> FULL LOAD: Reached present time for " + binanceSymbol);
                break;
            }

            start = nextStart; // continue pagination
        }

        System.out.println("  -> FULL LOAD COMPLETE for " + binanceSymbol +
                ". Total OHLCV points saved: " + totalSaved + "\n");
    }

}

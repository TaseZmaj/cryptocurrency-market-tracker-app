package mk.ukim.finki.wp.cryptocurrencyanalysisapp.service.Pipeline;

import lombok.RequiredArgsConstructor;
import mk.ukim.finki.wp.cryptocurrencyanalysisapp.model.DTOs.PipelineDTOs.HistoricalUpdateInfoDTO;
import mk.ukim.finki.wp.cryptocurrencyanalysisapp.model.MongoDBModels.HistoricalData;
import mk.ukim.finki.wp.cryptocurrencyanalysisapp.repository.HistoricalDataRepository;
import mk.ukim.finki.wp.cryptocurrencyanalysisapp.utils.ApiFetchingUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Semaphore;
import java.util.stream.Collectors;

import static mk.ukim.finki.wp.cryptocurrencyanalysisapp.utils.TransformationUtils.transformKlinesToHistoricalData;

@Service
//@RequiredArgsConstructor
public class Filter3 {

    private final HistoricalDataRepository historicalDataRepository;
    private final ApiFetchingUtils apiFetchingUtils;

    @Autowired
    public Filter3(HistoricalDataRepository historicalDataRepository, ApiFetchingUtils apiFetchingUtils, @Qualifier("filterExecutor") Executor executor) {
        this.historicalDataRepository = historicalDataRepository;
        this.apiFetchingUtils = apiFetchingUtils;
        this.executor = executor;
    }

    // Semaphore to limit concurrent API calls
    private static final int MAX_CONCURRENT_REQUESTS = 20;
    private final Semaphore semaphore = new Semaphore(MAX_CONCURRENT_REQUESTS);

    private static final String BINANCE_KLINE_API = "https://api.binance.com/api/v3/klines";
    private static final String DEFAULT_INTERVAL = "1d";
    private static final int MAX_KLINES_PER_CALL = 1000;
    private static final String DEFAULT_QUOTE_ASSET = "USDT";

    @Qualifier("filterExecutor")
    private final Executor executor;

    public void run(List<HistoricalUpdateInfoDTO> symbolsWithLastDate) {

        List<CompletableFuture<Void>> futures = symbolsWithLastDate.stream()
                .map(dto -> CompletableFuture.runAsync(
                        () -> fetchMissingData(dto), executor))
                .toList();

        // Wait for all updates to finish
        futures.forEach(CompletableFuture::join);
    }

    private void fetchMissingData(HistoricalUpdateInfoDTO dto) {
        try {
            semaphore.acquire();  // respect Binance API limits
            try {
                // Start AT the latest stored candle, not after it: Binance returns candles with
                // openTime >= startTime, so starting even 1ms later skips the next day's candle.
                // Re-fetching the latest candle also refreshes it if it was saved while the day was in progress.
                Instant lastTimestamp = dto.getLastUpdatedDate();
                long start = lastTimestamp.toEpochMilli();
                long now = Instant.now().toEpochMilli();

                if (start >= now) {
                    System.out.println("  -> Filter 3: No new data to fetch for " + dto.getTickerSymbol());
                    return; // nothing to do
                }

                int batchCount = 0;
                while (start < now) {
                    String binanceSymbol = dto.getTickerSymbol() + DEFAULT_QUOTE_ASSET;
                    String url = String.format("%s?symbol=%s&interval=%s&startTime=%d&limit=%d",
                            BINANCE_KLINE_API,
                            binanceSymbol,
                            DEFAULT_INTERVAL,
                            start,
                            MAX_KLINES_PER_CALL);

                    List<List<Object>> klines = apiFetchingUtils.callBinanceWithRetry(url);
                    if (klines == null || klines.isEmpty()) break;

                    List<HistoricalData> batch = transformKlinesToHistoricalData(dto.getCoinId(), klines);
                    reuseExistingIds(dto.getCoinId(), batch);
                    historicalDataRepository.saveAll(batch);
                    batchCount++;

                    long lastOpenTime = Long.parseLong(klines.get(klines.size() - 1).get(0).toString());
                    start = lastOpenTime + 1; // move to next candle
                }

                if(batchCount!=0){
                    System.out.println("Filter 3: Incremental update complete for " + dto.getTickerSymbol() + ". Batches: " + batchCount);
                }


            } finally {
                semaphore.release();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException(e);
        }
    }

    /**
     * Copies the Mongo id of already stored candles onto the fetched ones, so saveAll()
     * overwrites them (upsert) instead of violating the unique (symbolId, timestamp) index.
     */
    private void reuseExistingIds(String coinId, List<HistoricalData> batch) {
        if (batch.isEmpty()) return;

        Map<Instant, String> existingIds = historicalDataRepository
                .findBySymbolIdAndTimestampGreaterThanEqual(coinId, batch.get(0).getTimestamp())
                .stream()
                .collect(Collectors.toMap(HistoricalData::getTimestamp, HistoricalData::getId, (a, b) -> a));

        batch.forEach(candle -> candle.setId(existingIds.get(candle.getTimestamp())));
    }
}
package mk.ukim.finki.wp.cryptocurrencyanalysisapp.service.Pipeline;

import mk.ukim.finki.wp.cryptocurrencyanalysisapp.model.DTOs.PipelineDTOs.RawSymbolDTO;
import mk.ukim.finki.wp.cryptocurrencyanalysisapp.model.MongoDBModels.Symbol;
import mk.ukim.finki.wp.cryptocurrencyanalysisapp.repository.SymbolRepository;
import mk.ukim.finki.wp.cryptocurrencyanalysisapp.utils.TransformationUtils;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import lombok.RequiredArgsConstructor;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class Filter1 {
    private final SymbolRepository symbolRepository;
    private final RestTemplate restTemplate;

    private static final String BASE_SYMBOL_FETCH_API = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=";

    public List<Symbol> run() {
        //1. Symbol Extraction from API
        List<RawSymbolDTO> rawSymbols = extractRawSymbolsFromApi(BASE_SYMBOL_FETCH_API);

        //2. Filtering and transformation
        List<Symbol> cleanSymbols = rawSymbols.stream()
                .filter(this::isValidForInclusion) // Filtering -> removing invalid symbols
                .map(TransformationUtils::transformToSymbol) // Transformation from RawSymbolDTO to Symbol
                .collect(Collectors.toList());

        // 3. Loading data into MongoDB
        System.out.println("  -> Filter 1: Saving symbols to database...");
        symbolRepository.saveAll(cleanSymbols);
        System.out.println("  -> Filter 1: Successfully saved symbols to database.");

        // 4. Removing symbols that no longer pass the filter, so their stale data doesn't stay in the coin list.
        // Skipped when the extraction failed (empty) or was interrupted (partial), to avoid wiping valid symbols
        if (!cleanSymbols.isEmpty() && !Thread.currentThread().isInterrupted()) {
            removeStaleSymbols(cleanSymbols);
        }

        System.out.println("Filter 1 Completed: Successfully synced " + cleanSymbols.size() + " active symbols to MongoDB.");
        return cleanSymbols;
    }


    //PRIVATE METHODS (for implementing the filter)

    private List<RawSymbolDTO> extractRawSymbolsFromApi(String API_URL) {

        final int TOTAL_PAGES = 4; //4 pages * 250 symbols
        List<RawSymbolDTO> allSymbols = new ArrayList<>();

        System.out.println("Starting multi-page API extraction for 1000 symbols...");

        try {
            for (int page = 1; page <= TOTAL_PAGES; page++) {
                String url = API_URL + page;

                // API call for each page (1,2,3 and 4)
                ResponseEntity<List<RawSymbolDTO>> response = restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        null,
                        new ParameterizedTypeReference<>() {}
                );

                List<RawSymbolDTO> pageSymbols = response.getBody();
                if (pageSymbols == null || pageSymbols.isEmpty()) {
                    System.out.println("Warning: Page " + page + " returned empty results. Stopping.");
                    break; // Stop if there is no more data
                }

                allSymbols.addAll(pageSymbols); //Add the results to the main List
                System.out.println("  -> Successfully retrieved " + pageSymbols.size() + " symbols from Page " + page);

                Thread.sleep(3000);
            }

            System.out.println("Extraction successful. Retrieved a total of " + allSymbols.size() + " raw symbols.");
            return allSymbols;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("  -> ERROR: API extraction interrupted.");
            return allSymbols;
        } catch (Exception e) {
            System.err.println("  -> CRITICAL ERROR: Failed to fetch data from CoinGecko API: " + e.getMessage());
            e.printStackTrace();
            return List.of();
        }
    }

    private boolean isValidForInclusion(RawSymbolDTO raw) {
        // Excludes invalid/fiat symbols
        if (raw.getName().toLowerCase().contains("lira") || raw.getName().toLowerCase().contains("fiat") || raw.getSymbol().length() > 5) {
            System.out.println("Filter 1: Skipping suspected non-crypto asset: " + raw.getSymbol());
            return false;
        }

        // Excludes low liquidity/delisted crypto coins (through Market Cap and Volume)
        BigDecimal MIN_MARKET_CAP = new BigDecimal("10000000"); // Minimal Market Cap (10 Million USD just in case, not 1 million)
        BigDecimal MIN_VOLUME = new BigDecimal("100000"); //Minimum daily volume (100,000 USD)

        //Market Cap check
        if (raw.getMarketCap() == null || raw.getMarketCap().compareTo(MIN_MARKET_CAP) < 0) {
            System.out.println("Filter 1: Skipping low Market Cap asset: " + raw.getSymbol());
            return false;
        }

        // Total volume check - liquidity indicator AND is it delisted?
        if (raw.getTotalVolume() == null || raw.getTotalVolume().compareTo(MIN_VOLUME) < 0) {
            System.out.println("Filter 1: Skipping low Volume / potential delisted asset: " + raw.getSymbol());
            return false;
        }

        // "unstable quote currencies" requirement is met from the API url itself, more specifically, this part - vs_currency=usd

        // Duplicates are solved by using Symbol as well as ID and MongoDB's unique index
        return true;
    }

    private void removeStaleSymbols(List<Symbol> cleanSymbols) {
        Set<String> currentIds = cleanSymbols.stream().map(Symbol::getId).collect(Collectors.toSet());

        List<Symbol> staleSymbols = symbolRepository.findAll().stream()
                .filter(symbol -> !currentIds.contains(symbol.getId()))
                .toList();

        if (staleSymbols.isEmpty()) return;

        staleSymbols.forEach(symbol -> System.out.println("Filter 1: Removing symbol that no longer passes the filter: " + symbol.getSymbol() + " (" + symbol.getId() + ")"));
        symbolRepository.deleteAll(staleSymbols);
    }


}

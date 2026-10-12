import { Tooltip, useTheme } from "@mui/material";
import useCoins from "../../hooks/useCoins";
import InfoOutlineRoundedIcon from "@mui/icons-material/InfoOutlineRounded";

function InfoIconTooltip({ placement = "bottom", type, sx }) {
  const { palette } = useTheme();
  const { coin } = useCoins();

  const typeMessages = {
    quoteAsset: `The quote asset is the currency used to price or buy the base asset — in this case, ${coin?.quoteAsset}`,
    status:
      "This indicates the current operational state of the coin or trading pair, e.g., whether it’s active or inactive. ",
    lastPrice24h:
      "The most recent trading price of the coin within the last 24 hours.",
    highPrice24h:
      "The highest price the coin reached during the past 24 hours.",
    lowPrice24h: "The lowest price the coin reached during the past 24 hours.",
    volume24h:
      "The total amount of the coin traded across markets in the last 24 hours.",
    liquidity:
      "An estimate of how easily the coin can be bought or sold without significantly affecting its price.",
    ChartOHLC:
      "Displays the key price movements for a time period, marking the opening, closing, highest, and lowest prices reached.",
    ChartVolume:
      "Shows the total quantity of assets traded during each time period, indicating the intensity of market activity.",
    trendIndicators:
      "Trend indicators use moving averages to show the general direction of price movement over time, helping traders distinguish between upward, downward, and sideways trends.",
    bollingerBands:
      "Bollinger Bands measure market volatility by placing upper and lower bands around a moving average. Prices near the upper band may indicate overbought conditions, while prices near the lower band may indicate oversold conditions.",
    rsiPanel:
      "RSI measures the strength and speed of recent price movements to identify overbought or oversold conditions. Values below 30 suggest oversold conditions, while values above 70 suggest overbought conditions.",
    macdPanel:
      "MACD measures momentum by comparing two exponential moving averages of price. A bullish signal occurs when the MACD line crosses above the signal line, while a bearish signal occurs when it crosses below.",
    stochasticPanel:
      "The Stochastic Oscillator compares the closing price to its recent price range to assess momentum. Values below 20 indicate oversold conditions, while values above 80 indicate overbought conditions.",
    cciPanel:
      "CCI measures how far the price deviates from its historical average. Extreme positive values suggest overbought conditions, while extreme negative values suggest oversold conditions.",
    adxPanel:
      "ADX measures the strength of a market trend, regardless of its direction. Low values indicate a weak or sideways market, while higher values indicate a strong trend.",
    vma: "The volume moving average shows the average trading volume over a period of time. It is used to confirm price movements by comparing current volume to typical market activity.",
    overallSignal:
      "The overall signal summarizes multiple technical indicators to provide a combined buy, sell, or hold recommendation for the selected timeframe.",
    lstmPricePrediction:
      "This analysis uses a Long Short-Term Memory (LSTM) neural network trained on historical OHLCV data to forecast future prices. LSTM models are designed for time-series prediction and aim to capture long-term market patterns beyond traditional technical indicators.",
  };

  return (
    <Tooltip
      title={typeMessages[type]}
      placement={placement}
      enterTouchDelay={0}
      leaveTouchDelay={5000}
      sx={{ zIndex: 10 }}
    >
      <InfoOutlineRoundedIcon
        sx={{
          fontSize: "1rem",
          color: palette.primary.light,
          position: "relative",
          top: "3px",
          left: "0.01rem",
          ...sx,
        }}
      />
    </Tooltip>
  );
}

export default InfoIconTooltip;

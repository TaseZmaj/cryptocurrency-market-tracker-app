import { useState, useMemo, useEffect, memo } from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";
import {
  darkBackgroundColor,
  footerHeight,
  topBarHeight,
  headCells,
  tableCellsPadding,
  tableCellsPricePadding,
} from "../../util/uiVars.js";
import SearchInput from "./SearchInput.jsx";
import { getComparator } from "../../util/MaterialUtils.js";
import { useColorScheme } from "@mui/material/styles";
import useCoins from "../../hooks/useCoins.js";
import { tableQuery } from "./tableQuery.js";
import {
  FormControlLabel,
  Switch,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import MessageBox from "./MessageBox.jsx";
import LoadingSkeleton from "../../components/LoadingSkeleton.jsx";
import { formatCryptoPrice } from "../../util/stringUtils.js";
import { blue } from "@mui/material/colors";
import { useNavigate } from "react-router-dom";
import { getCsvAll24hDataAsync } from "../../util/CoinsApi.js";
import SquareButton from "../../components/SquareButton.jsx";
import useTableUi from "../../hooks/useTableUi.js";
import { motion } from "framer-motion";

export default function CoinTable() {
  const { coins, coinsLoading, coinsError, getAllCoins } = useCoins();
  const [filteredCoins, setFilteredCoins] = useState([]);
  const { mode } = useColorScheme();
  const { palette } = useTheme();

  const {
    order,
    setOrder,
    orderBy,
    setOrderBy,
    page,
    setPage,
    dense,
    setDense,
    rowsPerPage,
    setRowsPerPage,
    query,
    setQuery,
  } = useTableUi();

  //Variable made for performance optimizations
  const stableCoins = useMemo(() => coins, [coins]);

  //============= MUI Table handler funcions and vars ======================
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  // eslint-disable-next-line no-unused-vars
  const handleChangeDense = (event) => {
    setDense(event.target.checked);
  };
  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredCoins.length) : 0;
  //=======================================================================

  //====================== DATA FETCHING LOGIC ==========================
  //Fetches on mount AND every 10 minutes

  useEffect(() => {
    // if (coins.length === 0) getAllCoins();
    getAllCoins();

    const intervalId = setInterval(getAllCoins, 600_000);

    return () => clearInterval(intervalId);
  }, [getAllCoins /*, coins.length */]);
  //=====================================================================

  //========================= TABLE FILTERING ===========================
  //On change of the input - set the filteredCoins
  useEffect(() => {
    const timer = setTimeout(() => {
      tableQuery(query, stableCoins, setFilteredCoins);
    }, 225);
    return () => clearTimeout(timer);
  }, [query, stableCoins]);
  //=====================================================================

  //================BEHIND THE SCENES BROWSER OPTIMIZATION ==========================
  //This makes all icons warm in cache before rendering. Sorting becomes smooth.
  //This works behind the scenes in the browser.  We create an <img> element in
  //memory. It does NOT appear in the DOM, and it NEVER gets added to the UI. It's
  //only purpose is for loading.  THE MOMENT the img.src is set, the browser starts
  //downloading the image in the background, decodes the .png and caches the decoded
  //image in memory cache
  useEffect(() => {
    stableCoins.forEach((c) => {
      const img = new Image();
      img.src = c.coinIconUrl;
    });
  }, [stableCoins]);
  // ================================================================================

  // ====================== MUI <Table/> boilerplate==========================
  const sortedCoins = useMemo(() => {
    const data = filteredCoins.length || query ? filteredCoins : stableCoins;
    return [...data].sort(getComparator(order, orderBy));
  }, [filteredCoins, stableCoins, order, orderBy, query]);

  const visibleRows = useMemo(() => {
    return sortedCoins.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [sortedCoins, page, rowsPerPage]);
  //=========================================================================

  //TODOs:
  // TODO: Implement the different buttons - columns, filters, density and refresh
  //Optional:
  // TODO: Change the icon component in the table headers to a different arrow
  // TODO: Add animations
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: { xs: "center", sm: "flex-end" },
          gap: { xs: 1, sm: 0 },
          mb: 1,
          pt: "5px",
        }}
      >
        <SquareButton
          onClick={() => {
            getCsvAll24hDataAsync();
          }}
          type="exportToCsv24h"
          sx={{ width: "40px", height: "40px", mr: { xs: 0, sm: "11px" } }}
        ></SquareButton>
        <SearchInput
          query={query}
          setQuery={setQuery}
          sx={{ width: { xs: "min(300px, calc(100vw - 90px))", sm: "300px" } }}
        />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: `calc(100dvh - ${topBarHeight} - ${footerHeight} - 90px)`,
          // overflow: "hidden",
          // height: {
          //   xs: "auto",
          //   md: `calc(100vh - ${topBarHeight} - ${footerHeight} - 90px)`,
          // },
          overflow: { xs: "visible", md: "hidden" },
          backgroundColor:
            mode === "light" ? palette.background.paper : "transparent",
        }}
      >
        <TableContainer
          sx={{
            // overflow: coinsError ? "hidden" : "auto",
            flex: 1,
            minHeight: 0,
            overflow: !coinsError ? "auto" : "hidden",
            // overflowX: !coinsError ? "auto" : "hidden",
            // overflowY: { xs: "hidden", md: !coinsError ? "auto" : "hidden" },
            position: "relative",
            isolation: "isolate",
            "&::-webkit-scrollbar": {
              width: { xs: "10px", sm: "6px" },
              height: { xs: "10px", sm: "6px" },
            },
            borderBottom:
              mode === "light" ? "none" : `1px solid ${palette.grey[800]}`,
          }}
        >
          <Table
            sx={{
              width: "100%",
              minWidth: 650,
              "& th, & td": {
                fontSize: { xs: "1.3rem", sm: "1.2rem", lg: "1.1rem" },
              },
            }}
            aria-labelledby="tableTitle"
            size={dense ? "small" : "medium"}
            stickyHeader
          >
            <EnhancedTableHead
              // numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rowCount={
                (filteredCoins.length ? filteredCoins : stableCoins).length
              }
            />

            <TableBody>
              {/* All coins loading */}
              {coinsLoading && !coinsError
                ? Array.from({ length: rowsPerPage }).map((_el, i) => (
                    <TableRow
                      key={i}
                      tabIndex={-1}
                      slotprops={{
                        popper: {
                          modifiers: [
                            {
                              name: "offset",
                              options: {
                                offset: [0, -14],
                              },
                            },
                          ],
                        },
                      }}
                      sx={{
                        border: "none",
                        height: {
                          xs: "67px !important",
                          md: "65px !important",
                          lg: "62px !important",
                        },
                        boxSizing: "border-box",
                        "& td": {
                          borderBottom:
                            mode === "light"
                              ? `1px solid ${palette.divider}`
                              : `1px solid ${palette.grey[800]}`,
                        },
                      }}
                    >
                      {headCells.map((_el, i) => (
                        <TableCell
                          key={i}
                          scope="row"
                          sx={{
                            width: "36px",
                            height: "25px",
                            color:
                              mode === "light"
                                ? palette.text.primary
                                : palette.common.white,
                          }}
                        >
                          {/* Loading gray box */}
                          <LoadingSkeleton />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}

              {/* All coins error */}
              {!coinsLoading && (coinsError || coins.length === 0) ? (
                <Box
                  sx={{
                    position: "absolute",
                    width: "100%",
                    height: "calc(100% - 78px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MessageBox
                      type={coinsError ? "error" : "initializing"}
                      title={coinsError ? "Error!" : "Getting things ready"}
                      buttonType="refresh"
                      onClickFunc={getAllCoins}
                    >
                      {coinsError ||
                        "The project was just started and the data pipeline is populating the database. Please wait a little before trying again."}
                    </MessageBox>
                  </Box>
                </Box>
              ) : null}

              {/* Coins data table display */}
              {coins && !coinsLoading && !coinsError
                ? visibleRows.map((coin, index) => {
                    return (
                      <CoinRow
                        key={`${coin.coinId}-${page}-${orderBy}-${order}-${query}`}
                        coin={coin}
                        animationIndex={index}
                      />
                    );
                  })
                : null}

              {/* MUI boilerplate - for pagination adjustment on the last page */}
              {emptyRows > 0 && (
                <TableRow
                  style={{
                    height: (dense ? 33 : 53) * emptyRows,
                  }}
                  sx={{
                    "& td": {
                      borderBottom: "none",
                    },
                  }}
                >
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100, 250]}
          component="div"
          count={(filteredCoins.length ? filteredCoins : stableCoins).length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          SelectProps={{
            MenuProps: {
              MenuListProps: {
                sx: {
                  "& .MuiMenuItem-root": {
                    fontSize: { xs: "1.2rem", sm: "1.1rem", lg: "0.95rem" },
                  },
                },
              },
            },
          }}
          sx={{
            mt: "auto",
            flexShrink: 0,
            overflow: "visible",
            minHeight: "52px",
            color:
              mode === "light" ? palette.text.primary : palette.common.white,
            "& .MuiTablePagination-toolbar": {
              display: "flex",
              flexWrap: { xs: "wrap", sm: "wrap", md: "nowrap" },
              justifyContent: { xs: "center", sm: "center", md: "flex-end" },
              rowGap: { xs: 0 },
              marginTop: { xs: "5px" },
              minHeight: { xs: "68px", sm: "52px" },
              padding: { xs: "0 4px", sm: "0 16px" },
            },
            "& .MuiToolbar-gutters": {
              // backgroundColor: "teal",
            },

            "& .MuiTablePagination-spacer": {
              display: { xs: "none", sm: "block" },
            },
            "&&& .MuiTablePagination-actions": {
              width: { xs: "100%", sm: "auto" },
              marginLeft: {
                xs: "0 !important",
                sm: "0 !important",
                lg: "20px !important",
              },
              display: "flex",
              justifyContent: { xs: "center", sm: "initial" },
              "& .MuiIconButton-root": {
                padding: { xs: "4px", sm: "6px", lg: "4px" },
              },
              "& .MuiSvgIcon-root": {
                fontSize: { xs: "2rem", sm: "1.75rem", lg: "2rem" },
              },
            },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows, & .MuiTablePagination-select":
              {
                fontSize: { xs: "1.2rem", sm: "1.1rem", lg: "0.95rem" },
                color:
                  mode === "light"
                    ? palette.text.primary
                    : palette.common.white,
              },
            "& .MuiTablePagination-displayedRows": {
              margin: "4px",
            },
            "& .MuiTablePaginationActions-root": {
              marginTop: { xs: "5px", sm: 0 },
              height: "24px",
            },
            "& .MuiTablePagination-selectLabel": {
              margin: { xs: "0 0 0 38px", sm: "0px" },
            },
            ".MuiSvgIcon-root": {
              color:
                mode === "light" ? palette.text.primary : palette.common.white,
            },
            "& .MuiTablePagination-root": {
              position: "absolute",
            },
            "& .MuiToolbar-root": {
              position: { xs: "relative", sm: "" },
              top: { xs: "15px", sm: "0" },
            },
          }}
        />
      </Box>
      {/* <FormControlLabel
        control={<Switch checked={dense} onChange={handleChangeDense} />}
        label="Dense padding"
      /> */}
    </Box>
  );
}

function EnhancedTableHead({ order, orderBy, onRequestSort }) {
  const { palette } = useTheme();
  const { mode } = useColorScheme();

  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow
        sx={{
          "& th": {
            borderBottom: "none",
            borderTop:
              mode === "light"
                ? `1px solid ${palette.divider}`
                : `1px solid ${palette.grey[800]}`,
          },
        }}
      >
        {headCells.map((headCell) => (
          <TableCell
            sx={{
              boxSizing: "border-box",
              height: { xs: "48px", sm: "42px", lg: "36px" },
              position: "sticky",
              top: 0,
              zIndex: 2,
              width: headCell.width,
              padding:
                headCell.id == "marketCapRank" ||
                headCell.id == "name" ||
                headCell.id == "symbol"
                  ? tableCellsPadding
                  : tableCellsPricePadding,
              backgroundColor:
                mode === "light"
                  ? palette.background.paper
                  : darkBackgroundColor,
              color:
                mode === "light" ? palette.common.black : palette.common.white,
              overflow: "hidden",
            }}
            key={headCell.id}
            align={
              headCell.id === "marketCapRank"
                ? "left"
                : headCell.numeric
                  ? "right"
                  : "left"
            }
            // padding={headCell.disablePadding ? "none" : "normal"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
              sx={{
                "& .MuiTableSortLabel-icon": {
                  color:
                    mode === "light"
                      ? palette.common.black
                      : palette.common.white,
                },
                "&.Mui-active .MuiTableSortLabel-icon": {
                  color:
                    mode === "light"
                      ? palette.common.black
                      : palette.common.white,
                },
                "&:hover .MuiTableSortLabel-icon": {
                  color:
                    mode === "light"
                      ? palette.common.black
                      : palette.common.white,
                },
              }}
            >
              <Typography
                sx={{
                  fontWeight: "600",
                  fontSize: { xs: "1.2rem", sm: "1.1rem", lg: "0.95rem" },
                  color:
                    mode === "light"
                      ? palette.common.black
                      : palette.common.white,
                }}
              >
                {headCell.label}
              </Typography>

              {/* MUI boilerplate - for ordering the table by coulmn (asc, desc) */}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

const CoinRow = memo(function CoinRow({ coin, animationIndex }) {
  const { palette } = useTheme();
  const { mode } = useColorScheme();
  const isMobileOrTablet = useMediaQuery("(max-width: 899px)");
  const navigate = useNavigate();

  return (
    <Tooltip
      enterDelay={300}
      title={`Click for more info about ${coin.name} - ${coin.symbol}`}
      placement="top"
      sx={{ display: isMobileOrTablet ? "none" : "" }}
    >
      <TableRow
        component={motion.tr}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: animationIndex * 0.035,
          ease: "easeOut",
        }}
        onClick={() => navigate(`/coins/${coin.coinId}`)}
        tabIndex={-1}
        slotprops={{
          popper: {
            modifiers: [
              {
                name: "offset",
                options: {
                  offset: [0, -14],
                },
              },
            ],
          },
        }}
        sx={{
          border: "none",
          cursor: "pointer",
          height: {
            xs: "67px !important",
            md: "65px !important",
            lg: "62px !important",
          },
          boxSizing: "border-box",
          "&:hover": {
            backgroundColor: mode === "light" ? blue[50] : palette.grey[900],
          },
          transition:
            "background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 25ms",
          "& td": {
            borderBottom:
              mode === "light"
                ? `1px solid ${palette.divider}`
                : `1px solid ${palette.grey[800]}`,
          },
        }}
      >
        <TableCell
          scope="row"
          sx={{
            padding: tableCellsPadding,
            color:
              mode === "light" ? palette.text.primary : palette.common.white,
          }}
        >
          {coin.marketCapRank}
        </TableCell>

        <TableCell
          align="left"
          sx={{
            padding: tableCellsPadding,
            color:
              mode === "light" ? palette.text.primary : palette.common.white,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <img
              src={coin.coinIconUrl}
              alt={coin.name}
              width={27}
              height={27}
              style={{ borderRadius: "50%", marginRight: "10px" }}
            />

            <Typography
              sx={{
                fontWeight: "500",
                fontSize: { xs: "1.4rem", sm: "1.3rem", lg: "1.2rem" },
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                // whiteSpace: "nowrap",
              }}
            >
              {coin.name}
            </Typography>
          </Box>
        </TableCell>

        <TableCell
          align="left"
          sx={{
            padding: tableCellsPadding,
            color:
              mode === "light" ? palette.text.primary : palette.common.white,
          }}
        >
          {coin.symbol}
        </TableCell>

        <TableCell
          align="right"
          sx={{
            padding: tableCellsPricePadding,
            color:
              mode === "light" ? palette.text.primary : palette.common.white,
          }}
        >
          {formatCryptoPrice(coin.lastPrice)}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            padding: { xs: "12px", md: "16px" },
            color:
              mode === "light" ? palette.text.primary : palette.common.white,
          }}
        >
          {formatCryptoPrice(coin.volume24h)}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            padding: tableCellsPricePadding,
            color:
              mode === "light" ? palette.text.primary : palette.common.white,
          }}
        >
          {formatCryptoPrice(coin.high24h)}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            padding: tableCellsPricePadding,
            color:
              mode === "light" ? palette.text.primary : palette.common.white,
          }}
        >
          {formatCryptoPrice(coin.low24h)}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            color:
              mode === "light" ? palette.text.primary : palette.common.white,
          }}
        >
          {formatCryptoPrice(coin.liquidity24h)}
        </TableCell>
      </TableRow>
    </Tooltip>
  );
});

export const MAX_LONG_RANGE_POINTS = 180;

export function reduceLongRangeData(data) {
  if (data.length <= MAX_LONG_RANGE_POINTS) {
    return data;
  }

  return Array.from({ length: MAX_LONG_RANGE_POINTS }, (_, index) => {
    const sourceIndex = Math.round(
      (index * (data.length - 1)) / (MAX_LONG_RANGE_POINTS - 1),
    );
    return data[sourceIndex];
  });
}

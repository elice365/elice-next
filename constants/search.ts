export const searchConfig = {
  delay: 500,
  minLength: 2,
  type: {
    search: 'search',
    recently: 'recently',
    popular: 'popular',
    recommend: 'recommend'
  },
  option: {
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  },
};


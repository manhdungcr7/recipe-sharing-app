import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";

// Khởi tạo Typesense adapter
export const typesenseAdapter = new TypesenseInstantSearchAdapter({
  server: {
    apiKey: "Hu52dwsas2AdxdE",
    nodes: [
      {
        host: "localhost",
        port: "8108",
        protocol: "http"
      }
    ],
    cacheSearchResultsForSeconds: 2 * 60
  },
  additionalSearchParameters: {
    query_by: "title,ingredients,description",
    num_typos: 1
  }
});

export const searchClient = typesenseAdapter.searchClient;
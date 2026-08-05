export interface WikiReference {
  key: string;
  name: string;
}

export interface WikiSource extends WikiReference {
  displayName: string;
  gameSystem: WikiReference;
  permalink: string;
  publisher: WikiReference;
}

export interface WikiPageInfo {
  count: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  limit: number;
  page: number;
}

export interface WikiPage<T> {
  items: T[];
  pageInfo: WikiPageInfo;
}

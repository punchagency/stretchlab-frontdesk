export interface ApiError {
  response: {
    status: number;
    data: {
      message: string;
      access_token?: string;
      refresh_token?: string;
    };
  };
}

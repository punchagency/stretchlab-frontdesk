import { api } from "./api";

export const getGiftcardList = async () => {
  const response = await api.get("/stretchnote/settings/get-giftcard-list");
  return response;
};

export const saveGiftcard = async (giftcard_id: string) => {
  const response = await api.post("/stretchnote/settings/save-giftcard", {
    giftcard_id,
  });
  return response;
};

export const getMyRewards = async () => {
  const response = await api.get("/stretchnote/settings/my-rewards");
  return response;
};

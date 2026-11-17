import API from "./index";

const aiService = {
  analyzeCandidate: async (data) => {
    const res = await API.post("/ai/analyze", data);
    return res;
  },
};

export default aiService;

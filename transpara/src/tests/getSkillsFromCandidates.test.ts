interface ChatGPTExplanation {
  job_position: string;
  similarity: {
    score: number;
    max_score: number;
    comment: string;
  };
  shap_analysis: {
    positive_contributors: {
      feature: string;
      impact: string;
      comment: string;
    }[];
    negative_contributors: {
      feature: string;
      impact: string;
      comment: string;
    }[];
  };
  direct_observations: {
    skills: string[];
    experience: string[];
    education: string;
    comment: string;
  };
  notable_gaps_and_missing_requirements: string;
  gender_bias: {
    score: number;
    max_score: number;
    comment: string;
  };
  conclusion: string;
}

interface Explanation {
  candidate_file: string;
  similarity_score: number;
  bias_score: number;
  rank: number;
  id: string;
  chatgpt_explanation?: ChatGPTExplanation;
}

function getSkillsFromCandidates(data: Explanation[]): string[] {
  const allSkills = new Set<string>();
  data.forEach((candidate) => {
    candidate.chatgpt_explanation?.direct_observations?.skills?.forEach(
      (skill) => allSkills.add(skill.toLowerCase())
    );
  });
  return Array.from(allSkills);
}

describe("getSkillsFromCandidates", () => {
  it("extracts unique skills", () => {
    const mockData: Explanation[] = [
      {
        id: "1",
        candidate_file: "Test",
        rank: 1,
        similarity_score: 0.9,
        bias_score: 2.1,
        chatgpt_explanation: {
          job_position: "Dev",
          similarity: { score: 0.9, max_score: 1, comment: "" },
          shap_analysis: {
            positive_contributors: [],
            negative_contributors: [],
          },
          direct_observations: {
            skills: ["React", "Node", "React"],
            experience: [],
            education: "",
            comment: "",
          },
          notable_gaps_and_missing_requirements: "",
          gender_bias: { score: 1, max_score: 5, comment: "" },
          conclusion: "Good",
        },
      },
    ];

    const result = getSkillsFromCandidates(mockData);
    expect(result).toEqual(["react", "node"]);
  });
});

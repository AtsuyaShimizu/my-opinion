export const ATTRIBUTE_LABELS: Record<string, Record<string, string>> = {
  gender: { male: "男性", female: "女性", other: "その他", no_answer: "回答しない" },
  age_range: { "18-24": "18-24歳", "25-29": "25-29歳", "30-34": "30-34歳", "35-39": "35-39歳", "40-44": "40-44歳", "45-49": "45-49歳", "50-54": "50-54歳", "55-59": "55-59歳", "60-64": "60-64歳", "65_and_over": "65歳以上" },
  education: { junior_high: "中学校卒", high_school: "高校卒", vocational: "専門学校卒", junior_college: "短大卒", university: "大学卒", masters: "大学院卒（修士）", doctorate: "大学院卒（博士）", other: "その他" },
  occupation: { company_employee: "会社員", civil_servant: "公務員", self_employed: "自営業", executive: "経営者", professional: "専門職", educator_researcher: "教育・研究職", student: "学生", homemaker: "主婦・主夫", part_time: "パート・アルバイト", unemployed: "無職", retired: "退職者", other: "その他" },
  political_party: { ldp: "自由民主党", cdp: "立憲民主党", nippon_ishin: "日本維新の会", komeito: "公明党", dpfp: "国民民主党", jcp: "日本共産党", reiwa: "れいわ新選組", sdp: "社会民主党", sanseito: "参政党", other: "その他", no_party: "支持政党なし", no_answer: "回答しない" },
  political_stance: { left: "左派", center_left: "やや左派", center: "中道", center_right: "やや右派", right: "右派" },
};

// Chart/graph display用の短縮版ラベル（エコーチェンバー診断・投稿分析で使用）
export const ATTRIBUTE_LABELS_SHORT: Record<string, Record<string, string>> = {
  gender: { male: "男性", female: "女性", other: "その他", no_answer: "回答しない" },
  age_range: { "18-24": "18-24歳", "25-29": "25-29歳", "30-34": "30-34歳", "35-39": "35-39歳", "40-44": "40-44歳", "45-49": "45-49歳", "50-54": "50-54歳", "55-59": "55-59歳", "60-64": "60-64歳", "65_and_over": "65歳以上" },
  education: { junior_high: "中学校卒", high_school: "高校卒", vocational: "専門学校卒", junior_college: "短大卒", university: "大学卒", masters: "修士", doctorate: "博士", other: "その他" },
  occupation: { company_employee: "会社員", civil_servant: "公務員", self_employed: "自営業", executive: "経営者", professional: "専門職", educator_researcher: "教育・研究職", student: "学生", homemaker: "主婦・主夫", part_time: "パート", unemployed: "無職", retired: "退職者", other: "その他" },
  political_party: { ldp: "自民党", cdp: "立憲", nippon_ishin: "維新", komeito: "公明", dpfp: "国民", jcp: "共産", reiwa: "れいわ", sdp: "社民", sanseito: "参政", other: "その他", no_party: "なし", no_answer: "無回答" },
  political_stance: { left: "左派", center_left: "やや左派", center: "中道", center_right: "やや右派", right: "右派" },
};

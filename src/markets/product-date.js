export function extractJoongnaPostedAt(scriptTexts) {
  for (const text of scriptTexts) {
    const match = String(text).match(/\\"sortDate\\":\\"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\\"/);
    if (match) return new Date(`${match[1].replace(" ", "T")}+09:00`).toISOString();
  }
  return "";
}

export function extractMercariPostedAt(text, now = new Date()) {
  const match = String(text).match(/(\d+)\s*(分前|時間前|日前|か月前|ヶ月前|年前)/);
  if (!match) return { postedAt: "", postedAtText: "" };

  const value = Number(match[1]);
  const date = new Date(now);
  const unit = match[2];
  if (unit === "分前") date.setMinutes(date.getMinutes() - value);
  if (unit === "時間前") date.setHours(date.getHours() - value);
  if (unit === "日前") date.setDate(date.getDate() - value);
  if (unit === "か月前" || unit === "ヶ月前") date.setMonth(date.getMonth() - value);
  if (unit === "年前") date.setFullYear(date.getFullYear() - value);

  return { postedAt: date.toISOString(), postedAtText: match[0] };
}

export function extractKoreanRelativePostedAt(text, now = new Date()) {
  const source = String(text);
  const wordedMatch = source.match(/(방금 전|하루 전|한 달 전)/);
  const numericMatch = source.match(/(\d+)\s*(분 전|시간 전|일 전|개월 전|년 전)/);
  const match = wordedMatch ?? numericMatch;
  if (!match) return { postedAt: "", postedAtText: "" };

  const date = new Date(now);
  if (wordedMatch) {
    if (match[1] === "하루 전") date.setDate(date.getDate() - 1);
    if (match[1] === "한 달 전") date.setMonth(date.getMonth() - 1);
  } else {
    const value = Number(match[1]);
    const unit = match[2];
    if (unit === "분 전") date.setMinutes(date.getMinutes() - value);
    if (unit === "시간 전") date.setHours(date.getHours() - value);
    if (unit === "일 전") date.setDate(date.getDate() - value);
    if (unit === "개월 전") date.setMonth(date.getMonth() - value);
    if (unit === "년 전") date.setFullYear(date.getFullYear() - value);
  }

  return { postedAt: date.toISOString(), postedAtText: match[0] };
}

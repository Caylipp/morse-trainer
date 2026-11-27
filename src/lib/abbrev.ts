/**
 * Q-Codes und gängige Funk-Abkürzungen mit Bedeutung in DE/EN/VI.
 * Prosigns (AR, SK, BK …) fehlen bewusst: Sie werden ohne Zeichenpause gesendet,
 * die Wiedergabe kennt sie noch nicht.
 */

export type AbbrevKind = 'q' | 'abbr';

export interface Abbrev {
  /** Zeichenfolge, wie sie gesendet wird (auch die ID). */
  code: string;
  kind: AbbrevKind;
  de: string;
  en: string;
  vi: string;
}

const q = (code: string, de: string, en: string, vi: string): Abbrev => ({ code, kind: 'q', de, en, vi });
const a = (code: string, de: string, en: string, vi: string): Abbrev => ({ code, kind: 'abbr', de, en, vi });

/** Reihenfolge = Lernreihenfolge (Häufigstes zuerst). */
export const ABBREVIATIONS: readonly Abbrev[] = [
  a('CQ', 'Allgemeiner Anruf an alle', 'General call to everyone', 'Gọi chung tới tất cả'),
  q('QTH', 'Mein Standort ist …', 'My location is …', 'Vị trí của tôi là …'),
  q('QSL', 'Empfang bestätigt', 'Received, confirmed', 'Đã nhận, xác nhận'),
  a('73', 'Beste Grüße', 'Best regards', 'Lời chào thân ái'),
  q('QRZ', 'Wer ruft mich?', 'Who is calling me?', 'Ai đang gọi tôi?'),
  q('QRM', 'Ich werde gestört (Störung durch andere Sender)', 'I am being interfered with', 'Tôi bị nhiễu bởi trạm khác'),
  q('QRN', 'Ich habe atmosphärische Störungen', 'I have static noise', 'Tôi bị nhiễu khí quyển'),
  q('QSB', 'Die Signalstärke schwankt', 'Your signals are fading', 'Tín hiệu của bạn lúc mạnh lúc yếu'),
  q('QRT', 'Ich stelle den Betrieb ein', 'I am closing down', 'Tôi ngừng phát sóng'),
  q('QSO', 'Funkverbindung zu einer Station', 'A contact with another station', 'Một cuộc liên lạc với trạm khác'),
  a('DE', 'von (vor dem eigenen Rufzeichen)', 'from (before my call sign)', 'từ (trước tên hiệu của tôi)'),
  a('TNX', 'Danke', 'Thanks', 'Cảm ơn'),
  a('PSE', 'Bitte', 'Please', 'Xin vui lòng'),
  q('QRL', 'Die Frequenz ist belegt', 'The frequency is busy', 'Tần số đang bận'),
  q('QRS', 'Bitte langsamer geben', 'Please send more slowly', 'Xin gửi chậm hơn'),
  q('QRX', 'Bitte warten', 'Please wait', 'Xin chờ'),
  q('QSY', 'Frequenzwechsel', 'Change frequency', 'Đổi tần số'),
  a('GM', 'Guten Morgen', 'Good morning', 'Chào buổi sáng'),
  a('GA', 'Guten Tag', 'Good afternoon', 'Chào buổi chiều'),
  a('GE', 'Guten Abend', 'Good evening', 'Chào buổi tối'),
  a('GN', 'Gute Nacht', 'Good night', 'Chúc ngủ ngon'),
  a('OM', 'Funkfreund (männlich)', 'Old man, a male ham friend', 'Bạn vô tuyến (nam)'),
  a('YL', 'Funkerin', 'Young lady, a female ham', 'Nữ nghiệp dư vô tuyến'),
  a('FB', 'Ausgezeichnet', 'Fine business, excellent', 'Rất tốt'),
  a('ES', 'und', 'and', 'và'),
  a('UR', 'dein, deine', 'your', 'của bạn'),
  a('RST', 'Verständlichkeit, Lautstärke, Tonqualität', 'Readability, strength, tone report', 'Báo cáo độ rõ, độ mạnh, chất âm'),
  a('WX', 'Wetter', 'Weather', 'Thời tiết'),
  a('ANT', 'Antenne', 'Antenna', 'Ăng-ten'),
  a('DX', 'Weite Entfernung, Übersee', 'Long distance', 'Khoảng cách xa'),
  a('HI', 'Lachen', 'Laughter', 'Cười'),
  a('CW', 'Morsetelegrafie', 'Morse telegraphy', 'Điện báo Morse'),
  q('QRP', 'Ich sende mit geringer Leistung', 'Low transmitter power', 'Phát với công suất thấp'),
  q('QRO', 'Ich sende mit hoher Leistung', 'High transmitter power', 'Phát với công suất cao'),
  q('QRQ', 'Bitte schneller geben', 'Please send faster', 'Xin gửi nhanh hơn'),
  q('QRV', 'Ich bin bereit', 'I am ready', 'Tôi đã sẵn sàng'),
  q('QRK', 'Verständlichkeit Ihrer Zeichen', 'Readability of your signals', 'Độ rõ tín hiệu của bạn'),
  q('QSA', 'Signalstärke Ihrer Zeichen', 'Strength of your signals', 'Cường độ tín hiệu của bạn'),
  q('QRG', 'Ihre genaue Frequenz', 'Your exact frequency', 'Tần số chính xác của bạn'),
  q('QRA', 'Name meiner Station', 'The name of my station', 'Tên trạm của tôi'),
];

export const ABBREV_IDS: readonly string[] = ABBREVIATIONS.map((x) => x.code);

export function findAbbrev(code: string): Abbrev | undefined {
  return ABBREVIATIONS.find((x) => x.code === code);
}

/**
 * Antwortmöglichkeiten: die richtige und `count - 1` falsche, bevorzugt gleicher Art
 * (Q-Code zu Q-Code), gemischt.
 */
export function buildChoices(
  correct: string,
  count = 4,
  random: () => number = Math.random,
): string[] {
  const target = findAbbrev(correct);
  if (!target) return [correct];
  const others = ABBREVIATIONS.filter((x) => x.code !== correct);
  const same = others.filter((x) => x.kind === target.kind);
  const rest = others.filter((x) => x.kind !== target.kind);
  const shuffle = <T,>(list: T[]): T[] => {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  const wrong = [...shuffle(same), ...shuffle(rest)].slice(0, count - 1).map((x) => x.code);
  return shuffle([correct, ...wrong]);
}

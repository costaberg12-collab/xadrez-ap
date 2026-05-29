export const FILES = ['a','b','c','d','e','f','g','h'];
export const PIECE_SYMBOLS = {
  wp:'♙', wr:'♖', wn:'♘', wb:'♗', wq:'♕', wk:'♔',
  bp:'♟', br:'♜', bn:'♞', bb:'♝', bq:'♛', bk:'♚',
};
export const PIECE_NAMES = {
  p:'Peão', n:'Cavalo', b:'Bispo', r:'Torre', q:'Dama', k:'Rei',
};

export function sqColor(square) {
  if (!square) return 'dark';
  const fi = FILES.indexOf(square[0]);
  const ri = Number(square[1]) - 1;
  return (fi + ri) % 2 === 0 ? 'light' : 'dark';
}

export function posToSquare(file, rank) {
  return `${FILES[file]}${rank}`;
}

export function notationToAlgebraic(from, to, promotion = 'q') {
  const pieceNames = { p:'', n:'N', b:'B', r:'R', q:'Q', k:'K' };
  return `${pieceNames.p}${to}`;
}

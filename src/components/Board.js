import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../theme/palette';

const PIECES = {
  wp: '♙', wr: '♖', wn: '♘', wb: '♗', wq: '♕', wk: '♔',
  bp: '♟', br: '♜', bn: '♞', bb: '♝', bq: '♛', bk: '♚',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export default function Board({
  board,
  selectedSquare,
  onSquarePress,
  lastMoveFrom,
  lastMoveTo,
  flipped = false,
}) {
  const normalizedBoard = useMemo(() => {
    const rows = flipped ? [...board].reverse() : board;
    return rows.map((row, ri) => {
      const ranks = flipped ? [8 - ri] : [8 - ri];
      return { row, rank: ranks[0] };
    });
  }, [board, flipped]);

  function getSquareKey(colIndex, rank, flipped) {
    const fileIndex = flipped ? 7 - colIndex : colIndex;
    return `${FILES[fileIndex]}${rank}`;
  }

  function squareColor(square) {
    const fileIndex = FILES.indexOf(square[0]);
    const rankIndex = Number(square[1]) - 1;
    return (fileIndex + rankIndex) % 2 === 0 ? 'light' : 'dark';
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.fileTop}>
        {(flipped ? [...FILES].reverse() : FILES).map((f) => (
          <Text key={`f-${f}`} style={styles.axisLabel}>{f.toUpperCase()}</Text>
        ))}
      </View>
      <View style={styles.board}>
        {normalizedBoard.map(({ row, rank }) => (
          <View key={`rank-${rank}`} style={styles.rankRow}>
            <Text style={styles.axisSide}>{rank}</Text>
            <View style={styles.squareRow}>
              {row.map((piece, colIndex) => {
                const sq = getSquareKey(colIndex, rank, flipped);
                const isLight = squareColor(sq) === 'light';
                const isSelected = selectedSquare === sq;
                const isLastFrom = lastMoveFrom === sq;
                const isLastTo = lastMoveTo === sq;
                const pieceKey = `${sq}-${piece ? `${piece.color}${piece.type}` : 'empty'}`;
                return (
                  <TouchableOpacity
                    key={pieceKey}
                    style={[
                      styles.square,
                      isLight ? styles.squareLight : styles.squareDark,
                      isSelected && styles.squareSelected,
                      (isLastFrom || isLastTo) && styles.squareLastMove,
                    ]}
                    onPress={() => onSquarePress(sq)}
                    disabled={!onSquarePress}
                  >
                    <Text style={[styles.piece, !isLight && styles.pieceOnDark]}>
                      {piece ? PIECES[`${piece.color}${piece.type}`] : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  fileTop: {
    width: '100%',
    flexDirection: 'row',
    paddingLeft: 26,
    paddingRight: 8,
    marginBottom: 2,
  },
  axisLabel: {
    flex: 1,
    textAlign: 'center',
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  board: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
    width: '100%',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  axisSide: {
    width: 26,
    textAlign: 'center',
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: palette.surfaceElevated,
    paddingTop: 18,
  },
  squareRow: {
    flex: 1,
    flexDirection: 'row',
  },
  square: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareLight: {
    backgroundColor: '#E5D6AF',
  },
  squareDark: {
    backgroundColor: '#6D5336',
  },
  squareSelected: {
    backgroundColor: '#28F0A1',
  },
  squareLastMove: {
    backgroundColor: 'rgba(217,180,94,0.55)',
  },
  piece: {
    fontSize: 30,
  },
  pieceOnDark: {
    color: '#fff',
  },
});

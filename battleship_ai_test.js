const inCoords = (coord, coords) => {
    for (let i = 0; i < coords.length; i++) {
        let coordd = coords[i];
        if (coordd[0] === coord[0] && coordd[1] == coord[1]) return true;
    }
    return false;
};

let coords = [
    [1, 0],
    [1, 1],
    [1, 2],
];

let board = [];
for (let i = 0; i < 9; i++) {
    board.push([]);
    let row = board[board.length-1];
    for (let j = 0; j < 9; j++) {
        let space = inCoords([i, j], coords) ? 'submarine' : 'blank';
        row.push({attacked: false, ship: space});
    }
}

let ai = {
    moves: [[1, 0]],
    movesQueue: [],
    mode: 'random',
    pivots: [],
    attackDir: undefined,
    attackDist: 1,    
    abandonBackwards: false,
    abandonForwards: false,
};


const getSpace = (board, coord) => {
    return board[coord[0]][coord[1]];
};

const moveMissedOrAttacked = (board, move) => {
    let space = getSpace(board, move);
    return (space.attacked || space.ship === 'blank');
};

const getMovesQueue = (pivot, vertical) => {
    let idxToInc = vertical ? 0 : 1;
    let forwards = ['base'];
    let backwards = ['base'];
    for (let i = 1; i <= 4; i++) {
        let newPivot = pivot.slice(0);
        newPivot[idxToInc] += i;
        if (newPivot[idxToInc] > 9) break;
        forwards.push(newPivot);
    }
    for (let j = 1; j <= 4; j++) {
        let newPivot = pivot.slice(0);
        newPivot[idxToInc] -= j;
        if (newPivot[idxToInc] < 0) break;
        backwards.push(newPivot);
    }    
    return {forwards, backwards};  
};


const getMovesQueueIdx = ai => {
    let add = (ai.attackDir === 'forwards') ? 0 : 1;
    let base = (ai.attackDist - 1) * 2;
    return base + add;
};


const assessMovesQueue = (board, ai) => {
    // adjust values
    if (ai.attackDir === 'backwards' || (ai.abandonForwards && ai.attackDir === 'backwards') || ai.abandonBackwards) ai.attackDist += 1;

    if (ai.attackDir === 'forwards' && !ai.abandonBackwards) {
        ai.attackDir = 'backwards';
    } else if (ai.attackDir === 'backwards' && !ai.abandonForwards) {
        ai.attackDir = 'forwards';
    } else if (!ai.attackDir) {
        ai.attackDir = 'forwards';
    }

    if (ai.abandonBackwards && ai.abandonForwards) {
        ai.abandonHo = true;
        ai.abandonBackwards = false;
        ai.abandonForwards = false; 
        ai.attackDir = 'forwards';
        ai.attackDist = 1; 
        ai.movesQueue = getMovesQueue(ai.pivot[0], true);               
    }

    // let curIdxOfMovesQueue = getMovesQueueIdx(ai);

    // fist turn check for ho attacks
    let currentMove = ai.movesQueue[ai.attackDir][ai.attackDist];

    if (!currentMove) {
        ai.attackDist += 1;
        if (ai.attackDir === 'forwards') {
            ai.attackDir = 'backwards';
            ai.abandonForwards = true;
        } else {
            ai.attackDir = 'forwards';
            ai.abandonBackwards = true;            
        }
        return;
    }

    if (ai.attackDir === 'forwards' && ai.attackDist === 1) {
        if (moveMissedOrAttacked(board, currentMove) && moveMissedOrAttacked(board, ai.movesQueue['backwards'][1])) {
            ai.abandonHo = true;
            ai.movesQueue = getMovesQueue(ai.pivot[0], true); // might need recursive call here
        } else if (!moveMissedOrAttacked(board, currentMove)) {
            // first space empty
            return; 
        } else {
            ai.abandonForwards = true;
            return;
        }
    }


    // check last move

    if (moveMissedOrAttacked(board, currentMove)) {
        if (ai.attackDir === 'forwards') {
            ai.abandonForwards = true;
        } else {
            ai.abandonBackwards = true;
        }
    }

};

const aiMove = (board, ai) => {
    let {moves} = ai;

    let lastMove = moves[moves.length-1];
    let lastSpace = getSpace(board, lastMove);

    if (ai.mode === 'random' && lastSpace.ship !== 'blank') {
        ai.mode = 'ho';
        ai.pivots.push(lastMove);
        ai.movesQueue = getMovesQueue(lastMove);
    }

    assessMovesQueue(board, ai);

    return ai.movesQueue[ai.attackDir][ai.attackDist];    
    
};

for (let i = 1; i <= 3; i++) {
    // if (i == 2) debugger;
    let result = aiMove(board, ai);
    console.log('result: ', result);
}
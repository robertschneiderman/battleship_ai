let ships = [
    {
        name: 'Aircraft Carrier', 
        capacity: 5,
        hits: 0,
        coordinates: [],
        vertical: false
    }, {
        name: 'Battleship', 
        capacity: 4,
        hits: 0,
        coordinates: [],
        vertical: false
    },{
        name: 'Submarine', 
        capacity: 3,
        hits: 0,
        coordinates: [],
        vertical: false
    }, {
        name: 'Destroyer', 
        capacity: 3,
        hits: 0,
        coordinates: [],
        vertical: false
    },{
        name: 'Patrol Boat', 
        capacity: 2,
        hits: 0,
        coordinates: [],
        vertical: false
    }           
];

const inCoords = (coord, coords) => {
    for (let i = 0; i < coords.length; i++) {
        let coordd = coords[i];
        if (coordd[0] === coord[0] && coordd[1] == coord[1]) return true;
    }
    return false;
};

let coords = [
    [0, 1],
    [1, 1],
    [2, 1],
];

let board = {ships, grid: []};
for (let i = 0; i <= 9; i++) {
    board.grid.push([]);
    let row = board.grid[board.grid.length-1];
    for (let j = 0; j <= 9; j++) {
        let space = inCoords([i, j], coords) ? 'Submarine' : 'blank';
        row.push({attacked: false, ship: space});
    }
}

let ai = {
    moves: [[1, 1]],
    movesQueue: [],
    hits: 1,
    mode: 'random',
    pivots: [],
    attackDir: undefined,
    attackDist: 1,    
    abandonBackwards: false,
    abandonForwards: false,
};

const getRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandCoords = () => {
    return [getRandomNumber(0, 9), getRandomNumber(0, 9)];
};

const getUnattackedRandomMove = (grid) => {
    let randomCoords = getRandCoords();

    let space = getSpace(grid, randomCoords);
    while (space.attacked) {
        randomCoords = getRandCoords();
        space = getSpace(grid, randomCoords);
    }
    return randomCoords;
};

const isLastShipDestroyed = (board, lastSpace, ai) => {
    if (lastSpace.ship !== 'blank') {
        for (let i = 0; i < board.ships.length; i++) {
            let ship = board.ships[i];
            // if (ship.name === lastSpace.ship && ship.hits === ship.capacity) {
            if (ship.name === lastSpace.ship && ai.hits === ship.capacity) {
                return ship;
            }
        }
    }
    return false;
};

const removeAttackData = (ai, destroyedShip) => {
    destroyedShip.coordinates.forEach(coord => {
        let i = ai.hits.indexOf(coord);
        let j = ai.pivots.indexOf(coord);
        if( i !== -1) ai.hits.splice(i, 1);
        if( j !== -1) ai.hits.splice(j, 1);
    });
};


const getSpace = (grid, coord) => {
    return grid[coord[0]][coord[1]];
};

const moveMissedOrAttacked = (grid, move) => {
    let space = getSpace(grid, move);
    return (space.attacked || space.ship === 'blank');
};

const attacked = (grid, move) => {
    let space = getSpace(grid, move);
    return (space.attacked);
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


const assessMovesQueue = (grid, ai) => {
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
        ai.movesQueue = getMovesQueue(ai.pivots[0], true);               
    }

    // let curIdxOfMovesQueue = getMovesQueueIdx(ai);

    // fist turn check for ho attacks
    let currentMove = ai.movesQueue[ai.attackDir][ai.attackDist];

    if (!currentMove) {
        ai.attackDist += 1;
            ai.hits += 1;
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
        if (attacked(grid, currentMove) && attacked(grid, ai.movesQueue['backwards'][1])) {
            ai.abandonHo = true;
        } else if (!moveMissedOrAttacked(grid, currentMove)) {
            // first space empty
            ai.hits += 1;
            return; 
        } else {
            ai.abandonForwards = true;
            return;
        }
    }

            ai.hits += 1;

    // check last move

    if (moveMissedOrAttacked(grid, currentMove)) {
            ai.hits -= 1;
        
        if (ai.attackDir === 'forwards') {
            ai.abandonForwards = true;
        } else {
            ai.abandonBackwards = true;
        }
    }

};

const aiMove = (board, ai) => {
    let {moves} = ai;
    let {grid} = board;
    let lastShipDestroyed, lastMove, lastSpace;
    
    lastMove = ai.attackDir ? ai.movesQueue[ai.attackDir][ai.attackDist] : ai.moves[ai.moves.length-1];
    lastSpace = getSpace(grid, lastMove);
    lastShipDestroyed = isLastShipDestroyed(board, lastSpace, ai);


    if (ai.mode === 'random' && lastSpace.ship !== 'blank') {
        ai.mode = 'ho';
        ai.pivots.push(lastMove);
        ai.movesQueue = getMovesQueue(lastMove);
    }

    if (lastShipDestroyed) ai.mode = 'random';

    if (ai.mode === 'random') {
        let move = getUnattackedRandomMove(grid);
        ai.moves.push(move);
        return move;
    } else {
        assessMovesQueue(grid, ai);
        let move = ai.movesQueue[ai.attackDir][ai.attackDist];    
        ai.moves.push(move);
        return move;
    }


    
};

for (let i = 1; i <= 5; i++) {
    // if (i == 2) debugger;
    let result = aiMove(board, ai);
    console.log('result: ', result);
}
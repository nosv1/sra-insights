import React from 'react';

export class Cell {
    value: React.ReactNode;
    hover: string;

    constructor(
        value: React.ReactNode,
        hover: string | null = null
    ) {
        this.value = value;
        this.hover = hover || (typeof value === 'string' ? value : '');
    }
}

export class Row {
    row: Cell[];

    constructor(row: Cell[]) {
        this.row = row;
    }
}

export class Data {
    title: string;
    columns: string[];
    rows: Row[];

    constructor(title: string, columns: string[], rows: Row[]) {
        this.title = title;
        this.columns = columns;
        this.rows = rows;
    }
}


interface ArcadeLeaderboardProps {
    data: Data;
}

export const ArcadeLeaderboard: React.FC<ArcadeLeaderboardProps> = ({ data }) => {

    return (
        <div className="arcade-leaderboard">
            <h2>{data.title}</h2>
            <table>
                <thead>
                    <tr>
                        <th>Pos</th>
                        {data.columns.map((column, index) => (
                            <th key={index}>{column}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            <td>{rowIndex + 1}</td>
                            {row.row.map((cell, cellIndex) => (
                                <td key={cellIndex} title={cell.hover}>{cell.value}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
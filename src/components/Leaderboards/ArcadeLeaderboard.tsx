import React, { useState } from 'react';

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

interface ColumnSelectionProps {
    columns: string[];
    selectedColumns: string[];
    setSelectedColumns: React.Dispatch<React.SetStateAction<string[]>>;
}

export const ColumnSelection: React.FC<ColumnSelectionProps> = ({
    columns,
    selectedColumns,
    setSelectedColumns
}) => {
    const handleColumnChange = (column: string) => {
        setSelectedColumns(prev => {
            const newSelected = prev.includes(column) ?
                prev.filter(col => col !== column) :
                [...prev, column]
            return columns.filter(col => newSelected.includes(col));
        }
        );
    };

    return (
        <div className="column-selection">
            {columns.map(column => (
                <label key={column}>
                    <input
                        type="checkbox"
                        checked={selectedColumns.includes(column)}
                        onChange={() => handleColumnChange(column)}
                    />
                    {column}
                </label>
            ))}
        </div>
    );
};

interface ArcadeLeaderboardProps {
    data: Data;
}

export const ArcadeLeaderboard: React.FC<ArcadeLeaderboardProps> = ({ data }) => {
    const [selectedColumns, setSelectedColumns] = useState<string[]>(data.columns);

    return (
        <div className="arcade-leaderboard">
            <h2>{data.title}</h2>
            <div className="column-selection-container">
                <ColumnSelection columns={data.columns} selectedColumns={selectedColumns} setSelectedColumns={setSelectedColumns} />
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Pos</th>
                        {selectedColumns.map((column, index) => (
                            <th key={index}>{column}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            <td>{rowIndex + 1}</td>
                            {row.row.filter((_, cellIndex) => selectedColumns.includes(data.columns[cellIndex])).map((cell, cellIndex) => (
                                <td key={cellIndex} title={cell.hover}>{cell.value}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
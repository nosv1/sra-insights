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
    extra: React.ReactNode;

    constructor(row: Cell[], hover: React.ReactNode = null) {
        this.row = row;
        this.extra = hover;
    }
}

export class Data {
    title: string;
    columns: string[];
    defaultColumns: string[];
    rows: Row[];

    constructor(title: string, columns: string[], defaultColumns: string[], rows: Row[]) {
        this.title = title;
        this.columns = columns;
        this.defaultColumns = defaultColumns;
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
    const [selectedColumns, setSelectedColumns] = useState<string[]>(data.defaultColumns);
    const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };
    const sortedRows = [...data.rows].sort((a, b) => {
        if (!sortColumn) return 0;
        const columnIndex = data.columns.indexOf(sortColumn);

        const getStringValue = (value: React.ReactNode): string => {
            if (typeof value === 'string' || typeof value === 'number') return value.toString();
            if (React.isValidElement(value)) {
                const element = value as React.ReactElement;
                const children = element.props.children;
                if (typeof children === 'string' || typeof children === 'number') return children.toString();
                if (Array.isArray(children)) return children.map(getStringValue).join('');
                if (React.isValidElement(children)) return getStringValue(children);
            }
            return '';
        };

        const aValue = getStringValue(a.row[columnIndex].value);
        const bValue = getStringValue(b.row[columnIndex].value);

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

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
                            <th key={index} onClick={() => handleSort(column)}>
                                {column} {sortColumn === column ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedRows.map((row, rowIndex) => (
                        <React.Fragment key={rowIndex}>
                            <tr
                                className={hoveredRowIndex === rowIndex ? 'hovered-row' : ''}
                                onClick={() => setHoveredRowIndex(hoveredRowIndex === rowIndex ? null : rowIndex)}
                            >
                                <td>{rowIndex + 1}</td>
                                {row.row.filter((_, cellIndex) => selectedColumns.includes(data.columns[cellIndex])).map((cell, cellIndex) => (
                                    <td key={cellIndex} title={cell.hover}>{cell.value}</td>
                                ))}
                            </tr>
                            {hoveredRowIndex === rowIndex && row.extra && (
                                <tr>
                                    <td colSpan={selectedColumns.length + 1}>
                                        {row.extra}
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
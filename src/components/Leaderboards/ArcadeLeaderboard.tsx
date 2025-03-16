import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js'; // Import Plotly
import { downloadCSV } from '../../utils/Data';

export class Cell {
    displayValue: React.ReactNode;
    hover: string;
    sortValue: string | number | null;

    constructor(
        displayValue: React.ReactNode,
        hover: string | null = null,
        sortValue: string | number | null = null,
    ) {
        this.displayValue = displayValue;
        this.hover = hover || (typeof displayValue === 'string' ? displayValue : '');
        this.sortValue = sortValue || (typeof displayValue === 'string' ? displayValue : '');
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
    includePosition?: boolean
}

export const ArcadeLeaderboard: React.FC<ArcadeLeaderboardProps> = ({ data, includePosition = true }) => {
    const [selectedColumns, setSelectedColumns] = useState<string[]>(data.defaultColumns);
    const [numericColumns, setNumericColumns] = useState<string[]>([]);
    const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [showPlot, setShowPlot] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        setSelectedColumns(data.defaultColumns);

        setNumericColumns(data.columns.filter((_, index) =>
            data.rows.some(row => typeof row.row[index].sortValue === 'number')
        ));
    }, [data]);

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const handlePlotButtonClick = (column: string) => {
        setShowPlot(prev => ({ ...prev, [column]: !prev[column] }));
    };

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

    const leaderboardDataToCSV = (data: Data, selectedColumns: string[], includePosition: boolean) => {
        const headers = includePosition ? ['Pos', ...selectedColumns] : selectedColumns;
        const rows = data.rows.map((row, rowIndex) => {
            const rowData = selectedColumns.map(column => {
                const columnIndex = data.columns.indexOf(column);
                return getStringValue(row.row[columnIndex].displayValue);
            });
            return includePosition ? [rowIndex + 1, ...rowData].join(',') : rowData.join(',');
        });
        return [headers.join(','), ...rows].join('\n');
    };

    const sortedRows = [...data.rows].sort((a, b) => {
        if (!sortColumn) return 0;
        const columnIndex = data.columns.indexOf(sortColumn);

        const aValue = a.row[columnIndex].sortValue;
        const bValue = b.row[columnIndex].sortValue;

        if (aValue === null || bValue === null) return 0;

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="arcade-leaderboard">
            <h2>{data.title}</h2>
            <div className="plot-buttons-container">
                {numericColumns.map((column, index) => (
                    <button className="plot-button" key={index} onClick={() => handlePlotButtonClick(column)}>{showPlot[column] ? 'Hide' : 'Show'} {column} Plot</button>
                ))}
                <button className="plot-button" onClick={() => downloadCSV(leaderboardDataToCSV(data, selectedColumns, includePosition), 'leaderboard_data.csv')}>
                    Download CSV
                </button>
            </div>
            {numericColumns.map((column, index) => (
                <div key={index}>
                    {showPlot[column] && (
                        <div className="plot">
                            <Plot
                                data={[{
                                    x: sortedRows.map(row => getStringValue(row.row[0].displayValue)),
                                    y: sortedRows.map(row => row.row[data.columns.indexOf(column)].sortValue),
                                    type: 'scatter',
                                    mode: 'markers',
                                    name: column,
                                }]}
                                layout={{
                                    title: `${data.title} - ${column}`,
                                    xaxis: { title: { text: data.columns[0] } },
                                    yaxis: { title: column },
                                    height: 400,
                                    plot_bgcolor: 'rgba(0,0,0,0)',
                                    paper_bgcolor: '#2c2c2c',
                                    font: { color: '#e0e0e0' },
                                }}
                            />
                        </div>
                    )}
                </div>
            ))}
            <div className="column-selection-container">
                <ColumnSelection columns={data.columns} selectedColumns={selectedColumns} setSelectedColumns={setSelectedColumns} />
            </div>
            <table>
                <thead>
                    <tr>
                        {includePosition && <th>Pos</th>}
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
                                {includePosition && <td>{rowIndex + 1}</td>}
                                {row.row.filter((_, cellIndex) => selectedColumns.includes(data.columns[cellIndex])).map((cell, cellIndex) => (
                                    <td key={cellIndex} title={cell.hover}>{cell.displayValue}</td>
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
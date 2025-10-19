import {
	APPWRITE_DATABASE_ID,
	APPWRITE_TABLE_ANSWERS_ID,
    APPWRITE_TABLE_COMPETITIONS_ID,
    APPWRITE_TABLE_UPLOADS_ID,
    APPWRITE_TABLE_QUESTIONS_ID,
	APPWRITE_TABLE_AI_USAGES_ID,
	APPWRITE_TABLE_EXPLANATIONS_ID,
	APPWRITE_TABLE_REPORTS_ID
} from '$env/static/private';
import { serverClient } from '$lib/server/appwrite';
import { Databases, ID, Query, TablesDB } from 'node-appwrite';

export const tablesDB = new TablesDB(serverClient);

export const databaseId = APPWRITE_DATABASE_ID;

export async function getDatabase() {
	try {
		return await tablesDB.get({ databaseId: databaseId });
	} catch (error) {
		console.error('Error fetching database:', error);
		throw new Error('Failed to fetch database');
	}
}

export const tables = {
	answers: APPWRITE_TABLE_ANSWERS_ID,
	competitions: APPWRITE_TABLE_COMPETITIONS_ID,
	uploads: APPWRITE_TABLE_UPLOADS_ID,
	questions: APPWRITE_TABLE_QUESTIONS_ID,
	explanations: APPWRITE_TABLE_EXPLANATIONS_ID,
	aiUsages: APPWRITE_TABLE_AI_USAGES_ID,
	reports: APPWRITE_TABLE_REPORTS_ID
};

// TODO: type the queries parameter
export async function getRow(
	tableId: string,
	rowId: string,
	queries: string[] = []
) {
	try {
		const result = await tablesDB.getRow({
            databaseId: databaseId,
            tableId: tableId,
            rowId: rowId,
            queries: queries
        });
		if (!result) {
			throw new Error('Row not found');
		}
		return result;
	} catch (error) {
		console.error(`Error fetching row ${rowId} from table ${tableId}:`, error);
		throw new Error('Failed to fetch row');
	}
}

export async function listRows(tableId: string, queries: string[] = []) {
	try {
		const result = await tablesDB.listRows({
			databaseId: databaseId,
			tableId: tableId,
			queries: queries
		});
		return result.rows;
	} catch (error) {
		console.error(`Error listing rows from table ${tableId}:`, error);
		throw new Error('Failed to list rows');
	}
}

export async function getFirstRow(tableId: string, queries: string[] = []) {
	try {
		queries.push(Query.limit(1)); // Limit to 1 row
		const result = await tablesDB.listRows({
			databaseId: databaseId,
			tableId: tableId,
			queries: queries
		});
		if (result.total === 0) {
			throw new Error('No rows found');
		}
		return result.rows[0];
	} catch (error) {
		console.error(`Error fetching first row from table ${tableId}:`, error);
		throw new Error('Failed to fetch first row');
	}
}

export async function createRow(tableId: string, data: object) {
	try {
		return await tablesDB.createRow({
			databaseId: databaseId,
			tableId: tableId,
            rowId: ID.unique(),
			data: data
		});
	} catch (error) {
		console.error(`Error creating row in table ${tableId}:`, error);
		throw new Error('Failed to create row');
	}
}

export async function updateRow(tableId: string, rowId: string, data: object) {
	try {
		return await tablesDB.updateRow({
			databaseId: databaseId,
			tableId: tableId,
			rowId: rowId,
			data: data
		});
	} catch (error) {
		console.error(`Error updating row ${rowId} in table ${tableId}:`, error);
		throw new Error('Failed to update row');
	}
}

export async function incrementRowColumn(
	tableId: string,
	rowId: string,
	column: string,
	increment: number,
	max: number | undefined = undefined
) {
	try {
		return await tablesDB.incrementRowColumn({
			databaseId,
			tableId,
			rowId,
			column,
			value: increment,
			max
		});
	} catch (error) {
		console.error(
			`Error incrementing column ${column} in row ${rowId} of table ${tableId}:`,
			error
		);
		throw new Error('Failed to increment row column');
	}
}
export async function decrementRowColumn(
	tableId: string,
	rowId: string,
	column: string,
	decrement: number,
	min: number | undefined = undefined
) {
	try {
		return await tablesDB.decrementRowColumn({
            databaseId,
            tableId,
            rowId,
            column,
            value: decrement,
            min
        });
	} catch (error) {
		console.error(
			`Error decrementing column ${column} in row ${rowId} of table ${tableId}:`,
			error
		);
		throw new Error('Failed to decrement row column');
	}
}

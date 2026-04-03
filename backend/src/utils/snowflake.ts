import snowflake, { Connection, ConnectionOptions } from 'snowflake-sdk';

const options: ConnectionOptions = {
    account: process.env.SNOWFLAKE_ACCOUNT as string,
    username: process.env.SNOWFLAKE_USERNAME as string,
    password: process.env.SNOWFLAKE_PASSWORD as string,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    database: process.env.SNOWFLAKE_DATABASE,
    schema: process.env.SNOWFLAKE_SCHEMA,
    role: process.env.SNOWFLAKE_ROLE,
};

/**
 * Executes a SQL query on Snowflake and returns the results.
 */
export async function querySnowflake<T>(sqlText: string, binds: any[] = []): Promise<T[]> {
    const connection: Connection = snowflake.createConnection(options);

    return new Promise((resolve, reject) => {
        connection.connect((err, conn) => {
            if (err) {
                console.error('Unable to connect to Snowflake:', err.message);
                return reject(err);
            }

            conn.execute({
                sqlText,
                binds,
                complete: (err, stmt, rows) => {
                    if (err) {
                        console.error('Failed to execute query:', err.message);
                        return reject(err);
                    }
                    resolve(rows as T[]);
                },
            });
        });
    });
}

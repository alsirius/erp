import snowflake, { Connection, ConnectionOptions } from 'snowflake-sdk';

const options: ConnectionOptions = {
    account: (process.env.SNOWFLAKE_ACCOUNT || '').trim(),
    username: (process.env.SNOWFLAKE_USERNAME || '').trim(),
    password: (process.env.SNOWFLAKE_PASSWORD || '').trim(),
    warehouse: (process.env.SNOWFLAKE_WAREHOUSE || '').trim(),
    database: (process.env.SNOWFLAKE_DATABASE || '').trim(),
    schema: (process.env.SNOWFLAKE_SCHEMA || '').trim(),
    role: (process.env.SNOWFLAKE_ROLE || '').trim(),
};

/**
 * Executes a SQL query on Snowflake and returns the results.
 */
export async function querySnowflake<T>(sqlText: string, binds: any[] = []): Promise<T[]> {
    console.log(`❄️ Snowflake Executed by [${options.username}] using role [${options.role}]`);
    console.log(`🏠 Context: DB=[${options.database}], Schema=[${options.schema}]`);
    
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

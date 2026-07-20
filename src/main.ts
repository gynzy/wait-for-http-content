import * as core from '@actions/core';
import axios from 'axios';
import { wait } from './wait';

async function run(): Promise<void> {
    try {
        const url: string = core.getInput('url', { required: true });
        const attempts: number = parseInt(core.getInput('attempts') || '500', 10);
        const interval: number = parseInt(core.getInput('interval') || '1000', 10); // millieseconds
        const expectedContent: string = core.getInput('expectedContent');
        const failureMessage: string = core.getInput('failureMessage');

        console.log(`Polling url ${url} for ${attempts} attempts with a delay of ${interval}`);
        if (expectedContent) {
            console.log(`Awaiting specified content: ${expectedContent}`);
        }

        let currentAttempt = 1;

        while (currentAttempt <= attempts) {
            try {
                const response = await axios.get(url, { timeout: interval });

                if (expectedContent) {
                    if (String(response?.data) === expectedContent) {
                        console.log('expected content found... proceeding');
                        process.exit(0);
                    }
                } else if (response?.status === 200) {
                    console.log('expected status code found... proceeding');
                    process.exit(0);
                }

                console.log(
                    `attempt ${currentAttempt} gave code: ${response?.status} with content: ${String(response?.data)}`,
                );
            } catch (error) {
                console.log(`attempt ${currentAttempt} threw error: ${error}`);
            }

            await wait(interval);
            currentAttempt++;
        }

        throw new Error(
            `Error: Failed to receive expected content within specified attempts/interval.${
                failureMessage ? ` ${failureMessage}` : ''
            }`,
        );
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message);
        process.exit(1);
    }
}

run();

const rp = require('request-promise');
const chalk = require('chalk');

class ResponseTime
{
    constructor(startTime, endTime, successful, response = null, error = null)
    {
        this.startTime = new Date(startTime);
        this.endTime = new Date(endTime);
        this.successful = successful;
        this.response = response;
        this.error = error;
    }

    getTimeDifference()
    {
        return this.endTime - this.startTime;
    }
};

let getStagedRequest = (method, uri, headers) => {
    return rp({
        method: method,
        uri: uri,
        headers: headers,
    });
};

let timeRequest = (method, uri, headers) => {
    let startTime = new Date();
    return new Promise((resolve, reject) => {
        rp({
            method: method,
            uri: uri,
            headers: headers,
        }).then((response) => {
            let endTime = new Date();
            resolve(new ResponseTime(startTime, endTime, true, response, null));
        }, (reject) => {
            let endTime = new Date();
            reject(new ResponseTime(startTime, endTime, false, null, reject));
        }).catch((e) => {
            let endTime = new Date();
            reject(new ResponseTime(startTime, endTime, false, null, e));
        });
    });
};

let timeRequestPromise = (stagedRequest) => {
    let startTime = new Date();
    return new Promise((resolve, reject) => {
        stagedRequest.then((response) => {
            let endTime = new Date();
            resolve(new ResponseTime(startTime, endTime, true, response, null));
        }, (reject) => {
            let endTime = new Date();
            reject(new ResponseTime(startTime, endTime, false, null, reject));
        }).catch((e) => {
            let endTime = new Date();
            reject(new ResponseTime(startTime, endTime, false, null, e));
        });
    });
};

let getAverageResponseTime = (method, uri, headers) => {
    console.log(chalk.cyan(' -- Determining Average Response Time For Request -- '));
    console.log(`\tHTTP Method: ${method}\n\n\tRequest URI: ${uri}\n\n\tHeaders: ${JSON.stringify(headers)}`);
    let allResults = [];

    let stagedRequest = getStagedRequest(method, uri, headers);

    let setupChain = () => {
        return Promise.resolve({});
    }

    let feedFirstRequest = (result) => {
        return timeRequestPromise(stagedRequest);
    };

    let feedSecondRequest = (result) => {
        allResults.push(result);
        return timeRequestPromise(stagedRequest);
    }

    let feedThirdRequest = (result) => {
        allResults.push(result);
        return timeRequestPromise(stagedRequest);
    }

    let concludeTest = (result) => {
        allResults.push(result);

        let numSuccessful = 0;
        let numFailed = 0;
        let averageResponseTime = 0;
        let cumulativeResponseTime = 0;

        for(r of allResults)
        {
            if(!r.successful)
            {
                numFailed++;
                continue;
            }

            cumulativeResponseTime += r.getTimeDifference();
            numSuccessful++;
        }

        averageResponseTime = parseFloat(cumulativeResponseTime / numSuccessful).toFixed(3);

        console.log(chalk.green(`Num Successful: ${numSuccessful}`))
        console.log(chalk.cyan(`Average Response Time: ${averageResponseTime} MS`));
        console.log(chalk.red(`Num failed requests: ${numFailed}`));
    };

    setupChain()
        .then(feedFirstRequest)
        .then(feedSecondRequest)
        .then(feedThirdRequest)
        .then(concludeTest);
};

getAverageResponseTime('GET',
    'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD',
    {'contentType': 'application/json'}
);


module.exports = {
    timeRequest: timeRequest,
    ResponseTime: ResponseTime
};
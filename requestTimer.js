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
    'http://search-api-eurosport-prod.bamgrid.com/svc/search/v2/graphql?query=%7B%0A%09CategoryAll%20%7B%0A%09%20%20contentId%0A%09%20%20type%0A%09%20%20sport%0A%20%20%20%20defaultAssetImage%20%7B%0A%20%20%20%20%20%20contentId%0A%20%20%20%20%20%20type%0A%20%20%20%20%20%20altText%0A%20%20%20%20%20%20caption%0A%20%20%20%20%20%20credit%0A%20%20%20%20%20%20headline%0A%20%20%20%20%20%20rawImage%0A%20%20%20%20%20%20width%0A%20%20%20%20%20%20height%0A%20%20%20%20%20%20inning%0A%20%20%20%20%20%20purchaseUrl%0A%20%20%20%20%20%20timestamp%0A%20%20%20%20%20%20title%0A%20%20%20%20%7D%0A%09%7D%0A%7D',//'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD',
    {'contentType': 'application/json'}
);


module.exports = {
    timeRequest: timeRequest,
    ResponseTime: ResponseTime
};
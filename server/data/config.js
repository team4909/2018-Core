module.exports = {
    season: 2018,
    
    port: 4909,
    
    db: {
        interval: 1000,
        connection_string: "mongodb://localhost:27017/the-green-alliance",
        collections: {
            matchData: "matches",
            inputLog: "input_log"
        }
    }
};
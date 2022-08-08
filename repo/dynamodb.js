// imports
const aws = require('aws-sdk');
const { v4: generateRandomId } = require('uuid');

require('dotenv').config();

// configuring the AWS environment
aws.config.update({
    region: process.env.AWS_DEFAULT_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// creating the DynamoDB service object
const dynamoClient = new aws.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;


const getCharacters = async () => {
    // we set parameters
    const params = {
        TableName: TABLE_NAME
    };
    // let scan the table here 
    const characters = await dynamoClient.scan(params).promise();
    return characters.Items;
};

const addCharacter = async (character) => {
    
    character.id = generateRandomId();
    // establish the parameters
    const params = {
        TableName: TABLE_NAME,
        Item: character
    };
    // add the item into the table
    await dynamoClient.put(params).promise();

    return character.id;
};

const updateCharacter = async (character, id) => {
    // establish the parameters
    character.id = id;
    const params = {
        TableName: TABLE_NAME,
        Item: character
    };
    // update the item in the table
    await dynamoClient.put(params).promise();
    // return it
    return character.id;
}

const getCharacterById = async (id) => {
    // establish the parameters
    const params = {
        TableName: TABLE_NAME,
        Key: {
            id
        }
    };
    // get the item from the table
    const result = await dynamoClient.get(params).promise();
    // return it
    return result.Item;
};

const deleteCharacterById = async (id) => {
    // establish the parameters
    const params = {
        TableName: TABLE_NAME,
        Key: {
            id
        }
    };
    // delete the item from the table
    const result = await dynamoClient.delete(params).promise();
    // return it
    return result;
};

module.exports = {
    getCharacters,
    getCharacterById,
    deleteCharacterById,
    addCharacter,
    updateCharacter
};  




const axios = require('axios');
const { v4: generateRandomId } = require('uuid');
const { addOrUpdateCharacter } = require('./dynamodb');

const seedData = async () => {
    // api url
    const API_URL = 'http://hp-api.herokuapp.com/api/characters'
    // lets get the characters from hp api
    try{
        const { data } = await axios.get(API_URL);
        // loop through the characters and add them to the table
        data.forEach(async(character) => {
            if(character.actor === ""){
                return
            }else{
                await addOrUpdateCharacter({...character, id: generateRandomId()});
            }
        });

    }catch(e){
        console.log(e);
    }
    
}

// seedData();




// imports
const express = require("express");
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const jwt = require('jsonwebtoken');
const { addCharacter, updateCharacter, getCharacters, getCharacterById, deleteCharacterById} = require("./repo/dynamodb");

// definitions
const app = express();
// parse incoming json data
app.use(express.json());
// parse incoming form data
app.use(express.urlencoded({ extended: false }));
// set key
app.set('key', process.env.SECRET);


const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Character API',
            version: '1.0.0',
            description: 'This is a sample server for a character API',
            contact: {
                name: 'Alejo',
                email: 'alejocerutti4@gmail.com'
            },
            servers: ['http://localhost:3000']
        }
    },
    apis: ['./app.js'],
    components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
          },
        },
      },
    security: [{bearerAuth: [],}],
    

}

// swaggwer doc
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


const port = process.env.PORT || 3000;
// listen to the port
app.listen(port, () => {
  console.log(`Running on: http://localhost:${port}`);
  console.log(`Documentation on: http://localhost:${port}/api-docs`);
});

// routes

// hello world
app.get("/", (req, res) => {
  res.send("hello world");
});

/**
 * @swagger
 * components:
 *   schemas:
 *     HP:
 *       type: object
 *       required:
 *         - name
 *         - actor       
 *       example:
 *           ancestry: ''
 *           hairColour: ''
 *           wand:
 *              length: ''
 *              core: ''
 *              wood: ''
 *           alternate_names:
 *           - Olympe Maxime
 *           hogwartsStaff: false
 *           eyeColour: ''
 *           name: Madame Maxime
 *           gender: female
 *           actor: Frances de la Tour
 *           yearOfBirth: ''
 *           species: half-giant
 *           alive: true
 *           hogwartsStudent: false
 *           image: ''
 *           alternate_actors:
 *           - Ian Whyte
 *           dateOfBirth: ''
 *           wizard: true
 *           patronus: ''
 *           house: ''
 *     USER:
 *       type: object
 *       required:
 *         - user
 *         - password  
 *       properties:    
 *           user:
 *              type: string
 *           password:
 *              type: string      
*/

/**
 * @openapi
 * /login:
 *   post:
 *     tags:
 *        - Log In
 *     description: After logging in you will be given a token, you can use that token to use all routes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#components/schemas/USER'
 *     responses:
 *       200:
 *         description: you will receive a token
 *       401:
 *         description: user or password is incorrect.
 */
// login
app.post('/login', async (req, res) => {
    // validate user and password
    if(req.body.user === process.env.USER && req.body.password === process.env.PASSWORD){
        // create token payload
        const payload = {
            check: true
        };
        // create token
        const token = jwt.sign(payload, app.get('key'), {
            // expires in 30 minutes
            expiresIn: '30m'
        })
        res.status(200).send(JSON.stringify({
            message: "You are logged in",
            token
        }));
    }else{
        res.status(401).send(JSON.stringify({
            message: "The username or password is incorrect"
        }));
    }
})

const verify = express.Router();

// verify token
verify.use(async (req, res, next) => {
    let token = req.headers['authorization'] || req.headers['x-access-token'];
    // console.log(token);

    if(token){
        if(token.startsWith('Bearer ')){
            token = token.slice(7, token.length);
        }
        try{
            jwt.verify(token, app.get('key'), (err, decoded) => {
                if(err){
                    return res.status(401).send(JSON.stringify({
                        message: "The token is invalid"
                    }));
                }else{
                    req.decoded = decoded;
                    next();
                }
            });
            // req.decoded = decoded;
            // next();
        }catch(err){
            res.status(401).send(JSON.stringify({
                message: "You are not authorized to access this resource"
            }));
        }
    }else{
        res.status(401).send(JSON.stringify({
            message: "You are not authorized to access this resource"
        }));
    }
})



/**
 * @openapi
 * /characters:
 *   get:
 *     tags:
 *        - Get All Characters
 *     description: brings all the characters
 *     parameters:
 *      - in: header
 *        name: x-access-token
 *        description: Bearer token
 *        required: true
 *        schema:
 *           type: string
 *     responses:
 *       200:
 *         description: a succesfull response.
 *       500:
 *         description: internal server error.
 */
// get all  the characters
app.get("/characters", verify, async (req, res) => {
    try{
        const characters = await getCharacters();
        res.status(200).send(characters);
    }catch(err){
        res.status(500).send(JSON.stringify({
            message: "could not get characters",
            error: err
        }));
    }
});

/**
 * @openapi
 * /characters/{id}:
 *   get:
 *     tags:
 *       - Get Character By ID
 *     summary: Gets a character by ID.
 *     description: >
 *       You can get a specific character passing id.
 *     operationId: id
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Character ID
 *         required: true
 *         schema:
 *           type: string
 *       - name: x-access-token
 *         in: header
 *         description: Bearer token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful operation
 *       '500':
 *         description: internal server error
 */


// get a specific character by id
app.get("/characters/:id", verify, async (req, res) => {
    try{
        const character = await getCharacterById(req.params.id);
        res.status(200).send(character);
    }catch(err){
        res.status(500).send(JSON.stringify({
            message: "could not get character",
            error: JSON.stringify(err)
        }));
    }
})

/**
 * @openapi
 * /characters:
 *   post:
 *     tags:
 *       - Add a Character 
 *     summary: Adds a character.
 *     requestBody:
 *      description: Optional description in *Markdown*
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#components/schemas/HP'
 *     parameters:
 *       - name: x-access-token
 *         in: header
 *         description: Bearer token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful operation
 *       '500':
 *         description: internal server error
 */ 
// add a character
app.post("/characters", verify, async (req, res)=>{
    try{
        const character_id = await addCharacter(req.body);
        res.status(200).send(JSON.stringify({
            message: `character added with id ${character_id}`,
        }));
    }catch(err){
        res.status(500).send(JSON.stringify({
            message: "could not add the character",
            error: err
        }));
    }
})

/**
 * @openapi
 * /characters/{id}:
 *   put:
 *     tags:
 *       - Update a Character 
 *     summary: updates a character.
 *     operationId: id
 *     parameters:
 *       - name: id
 *         in: path
 *         description: User ID
 *         required: true
 *         schema:
 *           type: string
*       - name: x-access-token
 *         in: header
 *         description: Bearer token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#components/schemas/HP'
 *     responses:
 *       '200':
 *         description: Successful operation
 *       '500':
 *         description: internal server error
 */ 
// update a character by id
app.put("/characters/:id", verify, async (req, res)=>{
    const { id } = req.params;
    const character = req.body;
    try{
        await updateCharacter(character, id);
        res.status(200).send(JSON.stringify({
            message: `the character with ${id} has been updated succesfully`
        }));
    }catch(err){
        res.status(500).send(JSON.stringify({
            message: "could note update the character",
            error: err
        }));
    }
})



/**
 * @openapi
 * /characters/{id}:
 *   delete:
 *     tags:
 *       - Delete a character By ID
 *     summary: Delete a character by ID.
 *     description: >
 *       You can delete a specific character passing id.
 *     operationId: id
 *     parameters:
 *       - name: id
 *         in: path
 *         description: User ID
 *         required: true
 *         schema:
 *           type: string
 *       - name: x-access-token
 *         in: header
 *         description: Bearer token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful operation
 *       '500':
 *         description: internal server error
 */


// delete a character
app.delete("/characters/:id", verify, async (req, res) => {
    const { id } = req.params;
    try{
        await deleteCharacterById(id);
        res.status(200).send(JSON.stringify({message: `The character with id ${id} has been deleted succesfully`}));
    }catch(err){
        res.status(500).send(JSON.stringify({
            message: "could not delete the character",
            error: err
        }));
    }
})


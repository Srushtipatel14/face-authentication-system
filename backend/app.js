require("dotenv").config();
const express = require("express");
const cors = require("cors");
const PORT = process.env.PORT || 8000;
//const dbConnection = require("./dbconn");
const User = require("./models/userModel");
const app = express();
app.use(express.json());
app.use(cors());

//dbConnection();
const db=require("./dbconn")


//this code for mongoDB 

/*app.post("/register", async (req, res) => {
    const { user, pwd, descriptor } = req.body;

    console.log(user,pwd,descriptor)

    const parsedDescriptor = Array.isArray(descriptor) ? descriptor.map(Number) : [];
    try {
        const newUser = new User({
            user, pwd, descriptor,
        });
        await newUser.save();
        res.json({ success: true, message: 'Face descriptor saved successfully.' });
    } catch (error) {
        console.error('Error saving face descriptor:', error);
        res.status(500).json({ success: false, message: 'Failed to save face descriptor.' });
    }

});*/

//this code for mysql database

app.post("/register", async (req, res) => {
    const { user, pwd, descriptor } = req.body;
    const parsedDescriptor = Array.isArray(descriptor) ? JSON.stringify(descriptor) : null;
    const query = 'INSERT INTO users (user, pwd, descriptor) VALUES (?, ?, ?)';
    db.query(query, [user, pwd, parsedDescriptor], (err, result) => {
        if (err) {
            console.error('Error saving user:', err);
            return res.status(500).json({ success: false, message: 'Failed to register user.' });
        }
        res.json({ success: true, message: 'User registered successfully.' });
    });
});

// Function to compare descriptors (Euclidean Distance)
const compareDescriptors = (descriptor1, descriptor2) => {
    const distance = descriptor1.reduce((acc, value, index) => acc + Math.pow(value - descriptor2[index], 2), 0);
    return Math.sqrt(distance);  // Euclidean Distance
};

// function compareDescriptors(descriptor1, descriptor2) {
//     const dotProduct = descriptor1.reduce((sum, val, i) => sum + val * descriptor2[i], 0);
//     //console.log(dotProduct)
//     const magnitude1 = Math.sqrt(descriptor1.reduce((sum, val) => sum + val * val, 0));
//     const magnitude2 = Math.sqrt(descriptor2.reduce((sum, val) => sum + val * val, 0));
//     // console.log(dotProduct)
//     //console.log(magnitude1)
//     return dotProduct / (magnitude1 * magnitude2);
// }

app.post('/login', async (req, res) => {
    const { descriptor } = req.body; // Only receive the captured descriptor, no need for username

    try {

        const myQuery='select * from users';
        const users=await new Promise((resolve,reject)=>{
            db.query(myQuery,(err,result)=>{
                if(err){
                    reject(err)
                }
                resolve(result)
            })
        })

        //for mongoDB
        // const users = await User.find();
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'No registered users found.' });
        }

        let matchFound = false;
        let bestMatchDistance = Infinity; 
        let bestMatchUser = null;
        let id = null;
        users.forEach(user => {
            const storedDescriptor = JSON.parse(user.descriptor);

            const distance = compareDescriptors(descriptor, storedDescriptor);
            if (distance <bestMatchDistance) {
                bestMatchDistance = distance;
                id = user.id;
                bestMatchUser = user;
              
            }
        });

        const threshold = 0.4;
        if (bestMatchDistance <threshold) {
            matchFound = true;
            res.json({ success: true, message: 'Login successful!', user: bestMatchUser });
        }

        if (!matchFound) {
            return res.status(400).json({ success: false, message: 'No matching face found.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error during login.', error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`your program is running on port number ${PORT}`)
})





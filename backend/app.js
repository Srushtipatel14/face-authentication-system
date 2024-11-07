require("dotenv").config();
const express = require("express");
const cors = require("cors");
const PORT = process.env.PORT || 8000;
const dbConnection = require("./dbconn");
const User = require("./models/userModel");
const app = express();
app.use(express.json());
app.use(cors());

dbConnection();

app.post("/register", async (req, res) => {
    const { user, pwd, descriptor } = req.body;

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
        // Find all users with stored face descriptors in the database
        const users = await User.find();  // Find all users in the database
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'No registered users found.' });
        }

        let matchFound = false;
        let bestMatchDistance = Infinity;  // Start with a large distance valuess
        let bestMatchUser = null;
        let id = null;
        // Iterate over all users to compare their stored face descriptors with the captured descriptor
        users.forEach(user => {
            const storedDescriptor = user.descriptor;  // Assuming 'faceDescriptor' is stored in the database

            // Compare the captured descriptor with the stored one
            const distance = compareDescriptors(descriptor, storedDescriptor);
            console.log("distance", distance)

            // If this user has the closest match, save the user and distance
            if (distance <bestMatchDistance) {
                bestMatchDistance = distance;
                id = user._id;
                bestMatchUser = user;
              
            }
        });

        const threshold = 0.4;  // Set an appropriate threshold value (smaller distance = more similarity)

        // If the best match distance is below the threshold, login is successful
        console.log("best", bestMatchDistance)
        console.log("id:",id)
       
        if (bestMatchDistance <threshold) {
            matchFound = true;
            res.json({ success: true, message: 'Login successful!', user: bestMatchUser });
        }
        // else {
        //     // res.status(400).json({ success: false, message: 'Face recognition failed.' });
        //     matchFound=false
        // }

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





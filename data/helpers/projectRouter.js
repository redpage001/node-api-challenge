const express = require('express');
const Projects = require('./projectModel');
const Actions = require('./actionModel');

const router = express.Router();

router.get("/", (req, res) => {
    Projects.get()
        .then(projects => {
            if(projects){
                res.status(200).json(projects)
            } else {
                res.status(404).json({ message: "List of projects can not be found." })
            }
        })
        .catch(error => {
            console.log({ error })
            res.status(500).json({ message: "Error retrieving projects." })
        })
})

router.get("/:id", validateProjectId, (req, res) => {
    res.status(200).json(req.project)
})

router.get("/:id/actions", validateProjectId, (req, res) => {
    const { id } = req.params;

    Projects.getProjectActions(id)
        .then(actions => {
            console.log(actions)
            if(actions.length > 0){
                res.status(200).json(actions)
            } else {
                res.status(404).json({ message: "The specified project has no actions." })
            }
        })
        .catch(error => {
            console.log({ error })
            res.status(500).json({ message: "Error retrieving actions from project with specified ID." })
        })
})

router.post("/", validateProject, (req, res) => {
    const { name, description } = req.body;

    Projects.insert({ name, description })
        .then(project => {
            Projects.get(project.id)
                .then(newProject => {
                    if(newProject){
                        res.status(201).json(newProject)
                    } else {
                        res.status(404).json({ message: "The newly created project was not found." })
                    }
                })
                .catch(error => {
                    console.log({ error })
                    res.status(500).json({ message: "Error in retrieving newly created project." })
                })
        })
        .catch(error => {
            console.log({ error })
            res.status(500).json({ message: "Error creating project." })
        })
})

router.post("/:id/actions", validateProjectId, validateAction, (req, res) => {
    const { id: project_id } = req.project;
    const { description, notes } = req.body;
    console.log(req.project);

    Actions.insert({ description, notes, project_id })
        .then(action => {
            Actions.get(action.id)
                .then(newAction => {
                    if(newAction){
                        res.status(201).json(newAction)
                    } else {
                        res.status(404).json({ message: "The newly created action was not found." })
                    }
                })
                .catch(error => {
                    console.log({ error })
                    res.status(500).json({ message: "Error retrieving newly created action." })
                })
        })
        .catch(error => {
            console.log({ error })
            res.status(500).json({ message: "Error in adding action to project with specified ID." })
        })
})

router.delete("/:id", validateProjectId, (req, res) => {
    const { id } = req.params;

    Projects.remove(id)
        .then(count => {
            if(count){
                res.status(204).end()
            } else {
                res.status(404).json({ message: "The project withe the specified ID was not found." })
            }
        })
        .catch(error => {
            console.log({ error })
            res.status(500).json({ message: "Error deleting project with the specified ID." })
        })
})

router.put("/:id", validateProjectId, validateProject, (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    Projects.update(id, { name, description })
        .then(user => {
            if(user){
                Projects.get(id)
                    .then(updatedProject => {
                        if(updatedProject){
                            res.status(200).json(updatedProject)
                        } else {
                            res.status(404).json({ message: "Updated project was not found." })
                        }
                    })
                    .catch(error => {
                        console.log({ error })
                        res.status(500).json({ message: "Error finding updated project." })
                    })
            } else {
                res.status(404).json({ message: "Project with specified ID was not found." })
            }
        })
        .catch(error => {
            console.log({ error })
            res.status(500).json({ message: "Error updating the project with specified ID." })
        })
})

// Custom Middleware //

function validateProjectId(req, res, next) {
    const { id } = req.params;

    Projects.get(id)
        .then(project => {
            if(project){
                req.project = project;
                next();
            } else {
                res.status(404).json({ message: "Project with specified ID not found." })
            }
        })
        .catch(error => {
            console.log({ error })
            res.status(500).json({ message: "Error retriving project with specfied ID." })
        })
}

function validateProject(req, res, next) {
    const { name, description } = req.body;

    if(Object.entries(req.body).length === 0){
        res.status(400).json({ message: "No project data was found." })
    } else if (!name || !description ){
        res.status(400).json({ message: "Name and Description fields are required." })
    } else {
        next();
    }
}

function  validateAction(req, res, next) {
    const { description, notes } = req.body;

    if(Object.entries(req.body).length === 0){
        res.status(400).json({ message: "No action data was found." })
    } else if (!description || !notes ){
        res.status(400).json({ message: "Description and Notes fields are required." })
    } else if(description.length > 128){
        res.status(400).json({ message: "Description needs to be less than 128 characters." })
    } else {
        next();
    }
}

module.exports = router;
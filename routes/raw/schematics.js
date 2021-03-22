const { Router } = require('express')
var router = Router()

const schematicSchema = require('../../schemas/Schematic.js')

const schematicOverlay = require('../../schematicOverlay.js')

router.param('id', async (req, res, next, id) => {
  const schematic = await schematicSchema.findOne({ _id: id })
  
  if(!schematic) return res.redirect('/schematics')
  
  req.schematic = schematic
  
  next()
})

router.get('/:id/image', async (req, res) => {
  const { schematic } = req

  res.type('Content-Type', "image/png")
  res.send(schematic.image.Data)
})

router.get('/:id/overlay', async (req, res) => {
  const { schematic } = req

  let overlay = schematic.overlay
  if(!overlay){
    overlay = schematicOverlay.generate(schematic)
  }

  const image = schematicOverlay.overlay(overlay, schematic)

  res.type('Content-Type', "image/png")
  res.send(image)
})

module.exports = router
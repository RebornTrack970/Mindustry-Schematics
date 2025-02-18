const { Router } = require('express')
var router = Router()

const { Schematic } = require('mindustry-schematic-parser')

const schematicSchema = require('../../schemas/Schematic.js')
const schematicChangeSchema = require('../../schemas/SchematicChange.js')

const Tags = require('../../tags.json')

const limitPerPage = 20

router.post('/parse', async (req, res) => {
  const { text } = req.body
  if (!text || text == '') {
    res.status(400).send({ error: "This is not a valid schematic" })
    return
  }
  try {
    const decoded = decodeURIComponent(text)
    const schematic = Schematic.decode(decoded)

    res.send({
      name: schematic.name,
      description: schematic.description,
      powerProduction: schematic.powerProduction,
      powerConsumption: schematic.powerConsumption,
      requirements: schematic.requirements,
      image: (await schematic.toImageBuffer()).toString('base64')
    })
  } catch (error) {
    let code = 500
    if (error instanceof Error) {
      if (error.message.includes('valid')) code = 400
    } else if (typeof error == "string") {
      if (error.includes('valid')) code = 400
    }
    res.status(code).send({
      error
    })
  }
})

router.post('/create', async (req, res) => {
  var { name, author, creator, text, description, tags } = req.body

  try {
    const schematic = Schematic.decode(text)
  
    tags = JSON.parse(tags).map(tag => tag.name).filter(n => Tags.find(t => t.name == n))

    const {powerBalance, powerConsumption, powerProduction, requirements}=schematic
    const data = await schematic.toImageBuffer()
    const mimetype ="image/png"

    schematic.name = name
    schematic.description = description

    text = schematic.encode()

    const newSchematic = {
      name,
      creator: creator ? creator : author,
      tags: tags,
      text,
      description,
      encoding_version: schematic.version,
      powerBalance,
      powerConsumption,
      powerProduction,
      requirements,
      image: {
        Data: data,
        ContentType: mimetype
      }
    }

    const { id } = (await new schematicSchema(newSchematic).save())

    res.status(200).redirect( `/schematics/${id}`)
  } catch (error) {
    res.status(422).redirect(`/schematics`)
  }
})

router.param('id', async (req, res, next, id) => {
  const schematic = await schematicSchema.findOne({ _id: id })
  
  if(!schematic) return res.redirect('/schematics')
  
  req.schematic = schematic
  
  next()
})

router.post('/:id/edit', async (req, res) => {
  var originalSchematic = req.schematic
  var { name, author, creator, text, description, tags, cDescription } = req.body
  
  try {
    tags = JSON.parse(tags).map(tag => tag.name).filter(n => Tags.find(t => t.name == n))
  } catch (error) {
    tags = undefined;
  }

  const schematic = Schematic.decode(text)
  const {powerBalance, powerConsumption, powerProduction, requirements}=schematic
  const data = await schematic.toImageBuffer()
  const mimetype ="image/png"
  
  schematic.name = name
  schematic.description = description

  text = schematic.encode()

  const changedSchematic = {
    name,
    creator: creator ? creator : author,
    tags: tags,
    text,
    description,
    encoding_version: schematic.version,
    powerBalance,
    powerConsumption,
    powerProduction,
    requirements,
    image: {
      Data: data,
      ContentType: mimetype
    }
  }

  const schematicChange = {
    id: originalSchematic._id,
    Changed: changedSchematic,
    Description: cDescription,
  }

  const { id } = (await new schematicChangeSchema(schematicChange).save())

  res.redirect(`/schematics`)
})

router.post('/:id/delete', async (req, res) => {
  const { schematic } = req
  const { reason } = req.body
  
  const schematicChange = {
    id: schematic._id,
    Delete: reason,
  }
  
  await new schematicChangeSchema(schematicChange).save()
  
  res.redirect('/schematics')
})

module.exports = router
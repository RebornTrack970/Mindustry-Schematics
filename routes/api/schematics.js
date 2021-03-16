const { Router } = require('express')
var router = Router()

const { Schematic } = require('mindustry-schematic-parser')

const schematicSchema = require('../../schemas/Schematic.js')

const limitPerPage = 20

router.get('/', async (req, res) => {
  var { query, page } = req.query
  
  var schematics;
  
  if(!page || isNaN(page) || page < 1 || page % 1 != 0) page = 1
  else page = parseInt(page)
  
  const skip = limitPerPage * (page - 1);
  
  if(query){
    const regex = new RegExp(query, "i")
    const _query = { name: regex }
    schematics = await schematicSchema.find(_query, null, { skip, limit: limitPerPage })
    documents = await schematicSchema.countDocuments(_query)
  } else {
    query = ""
    schematics = await schematicSchema.find(null, null, { skip, limit: limitPerPage })
  }
  res.send({
    schematics
  })
})

router.get('/parse', async (req, res) => {
  const { text } = req.query
  try {
    const schematic = Schematic.decode(text)

    res.send({
      name: schematic.name,
      description: schematic.description,
      powerProduction: schematic.powerProduction,
      powerConsumption: schematic.powerConsumption,
      requirements: schematic.requirements,
      image: await schematic.toImageBuffer()
    })
  } catch (error) {
    res.send({ 
      error
    })
  }
})

router.post('/create', async (req, res) => {
  const schematics = await schematicSchema.find({})
  const { name, creator, text, description } = req.body

  const schematic = Schematic.decode(text)
  schematic.name = name
  schematic.description = description

  var _schematic = new schematicSchema({
    name: schematic.name,

  })

  _schematic = await new schematicSchema(_schematic).save()

  if(!_schematic) return res.redirect(`/schematics/create?success=false`)
  else res.redirect(`/schematics/create?success=true&id=${_schematic._id}`)
})

module.exports = router
import { Remito } from "../Models/remito.model.js";
import PDFDocument from "pdfkit";

export const saveRemito= async(req, res) => {
  try {
    const { clientData, remitar } = req.body;
    const nuevoRemito = new Remito({
      clientData,
      remitar
      // "numero" se genera solo gracias al middleware pre("save")
      // "fecha" se asigna automáticamente
    });
    const rem = await nuevoRemito.save();
    const valor = 10000; 
    const now = new Date(Date.now());
    const remito = new PDFDocument();
    res.setHeader("Content-Disposition", `inline; filename=remito-${rem.numero}.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    remito.pipe(res);
    /**HEADER**/
    remito.font('Courier-Bold').fontSize(10).text ("DEITRES SA",50,50,{align:"left"});
    remito.font('Courier').fontSize(10).text ("[x]",50,50,{align:"center"});
    remito.font('Courier-Bold').fontSize(10).text (`0003 - ${rem.numero}`,50,50,{align:"right"});
    remito.moveDown(2);
    remito.fontSize(9)
    remito.text('San Luis 4580 5° piso - Oficina 1',50,80);
    remito.text('7600 - MAR DEL PLATA',50,88);
    remito.text('Buenos Aires ',50,96); 
    remito.text('Tel: (0223) 4952500',50,104);
    remito.text('IVA: Responsable Inscripto',50,112);

    remito.text('REMITO',400,80,{align:"right"});
    remito.text(`Fecha: ${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`,400,88,{align:"right"})
    remito.text("CUIT:30-71109039-4",350,96,{align:"left"});
    remito.text("Ing. Brutos: 30-71109039-4",350,104,{align:"left"});
    remito.text("Inicio Actividades: 01/09/2009",350,112,{align:"left"});

    remito.moveDown(1);

    remito.font('Courier').fontSize(8).text(`${rem.clientData.razon_social}`,50,130);
    remito.text(`${rem.clientData.address}`,50,138);
    remito.text(`${rem.clientData.zip} - ${rem.clientData.city}`,50,146);
    remito.text(`Provincia - ${rem.clientData.state}`,50,154);
    remito.text(`IVA: ${rem.clientData.condicion_frente_al_iva}`,50,162);
    remito.text("Cond. de Venta: cta.cte 30 días",50,170);

    remito.text(`Cliente: ${rem.clientData.numero_cliente_infouno}`,350,130,{align:"left"});
    remito.text(`Kilos:`,350,138,{align:"left"});
    remito.text(`Bultos:`,350,146,{align:"left"});
    remito.text(`CUIT: ${rem.clientData.cuit___tax_id}`,350,154,{align:"left"});

    remito.moveTo(50,180).lineTo(550,180).lineWidth(2).stroke();
    remito.fontSize(8).text("Codigo",50,187)
    remito.fontSize(8).text("Cantidad",200,187)
    remito.fontSize(8).text("Descripcion",350,187)
    remito.moveTo(50,200).lineTo(550,200).lineWidth(2).stroke();
    for (let index = 0; index < remitar.length; index++) {
      if(remitar[index].producto.visible != false){
        console.log(remitar[index]);
        
        remito.fontSize(8).text(remitar[index].producto.properties.info_uno_id,50,(205+index*10))
        remito.fontSize(8).text(remitar[index].cantidad,200,(205+index*10))
        remito.fontSize(8).text(remitar[index].producto.properties.name,350,(205+index*10))
      }
    }
    remito.text(`Valor declarado: $${valor}`,50,650);
    remito.text("..............................",380,650,{align:"center"});
    remito.text("firma transportista",380,660,{align:"center"});
    remito.end();
  } catch (err) {
    console.error("Error al crear remito:", err);
    res.status(500).json({ error: "No se pudo crear el remito" });
  }
}
export const exportarRemito = async(req,res) =>{
    try {
        const id = req.params.id;
        console.log(id);
        console.log(req.body);
        const resp = await Remito.findByIdAndUpdate(id,{exported:req.body.exported});
        res.status(200).json({Message:"Remito exportado",Payload:resp});
    } catch (error) {
        res.status(500).json({Message:"Error al actualizar remito"})
    }
}
export const getRemitos = async(req,res) => {
    try {
        const respuesta = await Remito.find();
        res.status(200).json({Message:"Remitos obtenidos",Payload:respuesta});
    } catch (error) {
        res.status(500).json({Message:"Error al obtener los remitos",Description: error.message});
    }
}

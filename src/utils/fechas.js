export const formatDate = (isoDate)=>{
    const fecha = new Date(isoDate);
    const anio = fecha.getFullYear();
    const mes = fecha.getMonth()+1;
    const dia = fecha.getDate();
    const hora = fecha.getHours().toString().padStart(2, "0");
    const min = fecha.getMinutes().toString().padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}
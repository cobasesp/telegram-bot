const { token } = require('./config.json');
const { Telegraf } = require('telegraf')
const bot = new Telegraf(token)
var http = require('https');
const cheerio = require('cheerio');

const { Configuration, OpenAIApi } = require("openai");
// const { dotenv } = require('dotenv');
require('dotenv').config({path: '.env'})

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const chatPlaceholderResponses = [
    "Oido, un momento...",
    "Dame un momento para pensar.",
    "Un segundo!"
]

const openai = new OpenAIApi(configuration);

// Comando /start
bot.start((ctx) => ctx.reply('Welcome'))

// Comando /help
bot.help((ctx) => ctx.reply('Send me a sticker'))

// Cuando reciba un sticker o un mensaje
bot.on('sticker', (ctx) => ctx.reply('👍'))

// Recibir mensajes filtro por palabra clave y lanzo funcion
bot.on('message', (ctx) => {
    console.log(`Mensaje -> ${ctx.message.text}`);
    console.log(ctx.message.text.toLowerCase().indexOf('bottell'));

    if(ctx.message.text.toLowerCase() === 'pokef'){
        pokeF(ctx);
    }else if(ctx.message.text.toLowerCase() === 'epic'){
        getEpicFree(ctx);
    }else if(ctx.message.text.toLowerCase().indexOf('@cobitsbot') == 0){
        chatgpt(ctx);
    }else{
        // ctx.telegram.sendCopy(ctx.message.chat.id, ctx.message) // Copy the message
    }
    
});



// Cuando el mensaje enviado contenga x palabra
bot.hears('hi', (ctx) => ctx.reply('Hey there'))

bot.launch();
console.log("Bot started!")

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))


/**
 * Devuelve un pokemon fusionado 
 * 
 * @param {*} ctx 
 */
async function pokeF(ctx) {
    console.log("Recuperando Pokemon...")
    let p1 = Math.floor(Math.random() * 151);
    let p2 = Math.floor(Math.random() * 151);

    await http.request(encodeURI(`https://pokemon.alexonsager.net/${p1}/${p2}`), (response) => {

        var html = '';

        //Segun recibo chunks los añado a la string del json
        response.on('data', function (chunk) {
            html += chunk;
        });

        //Cuando acaba la peticion trato los datos y llamo a una funcion para la peticionque prepare el mensaje
        response.on('end', function () {
            const $ = cheerio.load(html);
            $('p').text('Bye moon');
            var name = $("#pk_name").text();
            var src = $("#pk_img").attr('src');
            ctx.telegram.sendMessage(ctx.message.chat.id, 'Hazte con todos!')
            ctx.telegram.sendPhoto(ctx.message.chat.id, src, {caption: name})
        });

    }).end();
}

/**
 * Recupera y devuelve los juegos gratis de epic games
 * 
 * @param {ç} ctx 
 */
async function getEpicFree(ctx) {
    await http.request(encodeURI(`https://www.cheapshark.com/api/1.0/deals?storeID=25&upperPrice=0`), (response) => {

        var json = '';

        //Segun recibo chunks los añado a la string del json
        response.on('data', function (chunk) {
            json += chunk;
        });

        //Cuando acaba la peticion trato los datos y llamo a una funcion para la peticionque prepare el mensaje
        response.on('end', function () {
            let data = JSON.parse(json);
            console.log(data[0]);
            sendInfoJuegos(ctx, data, 'epic');
        });

    }).end();
}

/**
 * Funcion que recibe los datos de los descuentos y prepara el mnsaje
 * 
 * @param {*} data 
 */
 function sendInfoJuegos(ctx, data, store) {
    if (store == 'steam') {
        console.log("Preparando descuentos de steam");
        let mensaje = `**:mag: Buscando juegos de steam con descuento (Solo 10)**\n\n`;
        message.channel.send(mensaje);

        data.forEach(juego => {
            message.channel.send(`\n\n${juego.title}  Precio: ~~${juego.normalPrice}€~~  **${juego.salePrice}€**\n`, { files: [juego.thumb] });
        });
    }

    if (store == 'epic') {
        ctx.reply("Epic tiene estos juegos gratuitos ahora mismo:")

        // A little delay to avoid put first the games an then this sentence
        setTimeout(function() {
            data.forEach(juego => {
                // message.channel.send(`\n\n${juego.title}  Precio: ~~${juego.normalPrice}€~~  **${juego.salePrice}€**\n`, { files: [juego.thumb] });
                ctx.telegram.sendPhoto(ctx.message.chat.id, juego.thumb, {caption: `\n\n${juego.title}  \n\nPrecio real: ${juego.normalPrice}€`})
            })
        }, 1000);
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

// Funcion para dar una respuesta mientras espero a la peticion del chatgpt
async function chatgpt(ctx) {
    try {
        const pregunta = ctx.message.text.toLowerCase().replace('bottell ', '');
        ctx.telegram.sendMessage(ctx.message.chat.id, chatPlaceholderResponses[getRandomInt(chatPlaceholderResponses.length)]);
        const respuesta = await generarRespuesta(pregunta);

        ctx.telegram.sendMessage(ctx.message.chat.id, respuesta);
    }catch(e){
        console.log(e);
    }
}

// Funcion para hacer una peticion a chatgpt
async function generarRespuesta(pregunta) {
    const modelo = 'text-davinci-003'; // Modelo de lenguaje de OpenAI
    const prompt = `Pregunta: ${pregunta}\nRespuesta:`; // Formato de la solicitud de OpenAI
  
    try{
        const completion = await openai.createCompletion({
            model: modelo,
            prompt: prompt,
            temperature: 0.6,
            n: 1,
            stop: '\n',
            max_tokens: 1000
            }
        ).catch(function(e) {
            return 'No puedo responderte a esa pregunta, intentalo de nuevo mas tarde';
        });

        console.log(completion.data.choices);

        let respuesta = completion.data.choices[0].text.trim();

        if(respuesta === ''){
            respuesta = 'No puedo responderte a esa pregunta, intentalo de nuevo mas tarde';
        }

        return respuesta;
    }catch(e){
      return 'No puedo responderte a esa pregunta, intentalo de nuevo mas tarde';
    }
    
}
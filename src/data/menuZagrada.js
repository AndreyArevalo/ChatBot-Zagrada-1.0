const MENU_ITEMS = [
  // Entradas
  { nombre: "Empanaditas", categoria: "entrada", aliases: ["empanaditas", "empanadita"] },
  { nombre: "Yukitas", categoria: "entrada", aliases: ["yukitas", "croquetas", "yukita"] },

  // Infantil / rápidos página 1
  { nombre: "Nuggets", categoria: "infantil", aliases: ["nuggets", "nugget"] },
  { nombre: "Crispy", categoria: "infantil", aliases: ["crispy"] },
  { nombre: "Mini Hamburguesa", categoria: "infantil", aliases: ["mini hamburguesa"] },
  { nombre: "Chori Papa", categoria: "infantil", aliases: ["chori papa"] },
  { nombre: "Chori Pollo", categoria: "infantil", aliases: ["chori pollo"] },

  // Pollo
  { nombre: "Pechuga Rellena Campesina", categoria: "pollo", aliases: ["pechuga rellena campesina"] },
  { nombre: "Pechuga Fusión", categoria: "pollo", aliases: ["pechuga fusion", "pechuga fusión"] },
  { nombre: "Pechuga Champiñones al Vino", categoria: "pollo", aliases: ["pechuga champiñones al vino"] },
  { nombre: "Chop Suey de Pollo y Champiñones", categoria: "pollo", aliases: ["chop suey de pollo y champiñones", "chop suey pollo"] },
  { nombre: "Pechuga del Palmar", categoria: "pollo", aliases: ["pechuga del palmar"] },
  { nombre: "Pechuga del Rancho", categoria: "pollo", aliases: ["pechuga del rancho"] },
  { nombre: "Pechuga a la Plancha", categoria: "pollo", aliases: ["pechuga a la plancha"] },

  // Cerdo
  { nombre: "Lomo Monarca", categoria: "cerdo", aliases: ["lomo monarca"] },
  { nombre: "Costillitas", categoria: "cerdo", aliases: ["costillitas", "costillas bbq", "costillas"] },
  { nombre: "Chuleta", categoria: "cerdo", aliases: ["chuleta"] },
  { nombre: "Lomito", categoria: "cerdo", aliases: ["lomito"] },
  { nombre: "Lomo a la Parrilla", categoria: "cerdo", aliases: ["lomo a la parrilla"] },

  // Adicionales
  { nombre: "Salsas de la casa", categoria: "adicional", aliases: ["salsas de la casa", "salsa de la casa"] },
  { nombre: "Papa a la francesa", categoria: "adicional", aliases: ["papa a la francesa", "papas a la francesa"] },
  { nombre: "Papa criolla", categoria: "adicional", aliases: ["papa criolla", "papas criollas"] },
  { nombre: "Yuca al vapor", categoria: "adicional", aliases: ["yuca al vapor"] },
  { nombre: "Arroz Blanco", categoria: "adicional", aliases: ["arroz blanco"] },
  { nombre: "Arroz de Coco", categoria: "adicional", aliases: ["arroz de coco"] },
  { nombre: "Ensalada", categoria: "adicional", aliases: ["ensalada"] },
  { nombre: "Guacamole", categoria: "adicional", aliases: ["guacamole"] },
  { nombre: "Jalapeño", categoria: "adicional", aliases: ["jalapeño", "jalapeno"] },
  { nombre: "Champiñones", categoria: "adicional", aliases: ["champiñones", "champinones"] },
  { nombre: "Cebollitas Ocañeras", categoria: "adicional", aliases: ["cebollitas ocañeras", "cebollitas ocaneras"] },
  { nombre: "Tocineta", categoria: "adicional", aliases: ["tocineta"] },
  { nombre: "Queso parmesano", categoria: "adicional", aliases: ["queso parmesano"] },
  { nombre: "Carne de Hamburguesa", categoria: "adicional", aliases: ["carne de hamburguesa"] },
  { nombre: "Pollo desmechado", categoria: "adicional", aliases: ["pollo desmechado"] },
  { nombre: "Carne desmechada", categoria: "adicional", aliases: ["carne desmechada"] },
  { nombre: "Camarones al ajillo", categoria: "adicional", aliases: ["camarones al ajillo"] },

  // Res
  { nombre: "Roma", categoria: "res", aliases: ["roma"] },
  { nombre: "Filet Mignon", categoria: "res", aliases: ["filet mignon"] },
  { nombre: "Lomo Saltado", categoria: "res", aliases: ["lomo saltado"] },
  { nombre: "Punta de Anca", categoria: "res", aliases: ["punta de anca"] },
  { nombre: "Lomito Fino", categoria: "res", aliases: ["lomito fino"] },

  // Pastas
  { nombre: "Coral Camersí", categoria: "pasta", aliases: ["coral camersi", "coral camersí"] },
  { nombre: "Grana", categoria: "pasta", aliases: ["grana"] },
  { nombre: "Marinera", categoria: "pasta", aliases: ["marinera"] },
  { nombre: "Mixta Oriental", categoria: "pasta", aliases: ["mixta oriental"] },
  { nombre: "Camarón del Oriente", categoria: "pasta", aliases: ["camaron del oriente", "camarón del oriente"] },
  { nombre: "Carbonara de Pollo", categoria: "pasta", aliases: ["carbonara de pollo"] },
  { nombre: "Pacifico", categoria: "pasta", aliases: ["pacifico", "pacífico"] },

  // Mixto / arroces / ensaladas / vegetariano
  { nombre: "Parrillada Mixta", categoria: "mixto", aliases: ["parrillada mixta"] },
  { nombre: "Arrecife", categoria: "arroz", aliases: ["arrecife"] },
  { nombre: "Mar y Tierra", categoria: "arroz", aliases: ["mar y tierra"] },
  { nombre: "Arriero", categoria: "arroz", aliases: ["arriero"] },
  { nombre: "Romana", categoria: "ensalada", aliases: ["romana"] },
  { nombre: "Primaveral", categoria: "vegetariano", aliases: ["primaveral"] },

  // Del mar / salmón / trucha
  { nombre: "Montenegro", categoria: "pulpo", aliases: ["montenegro"] },
  { nombre: "Alto Mare", categoria: "pulpo", aliases: ["alto mare"] },
  { nombre: "Cazuela de Mariscos", categoria: "del mar", aliases: ["cazuela de mariscos"] },
  { nombre: "Encocado de Camarones", categoria: "del mar", aliases: ["encocado de camarones"] },
  { nombre: "Salteado de Camarones", categoria: "del mar", aliases: ["salteado de camarones"] },
  { nombre: "Parrilla del Puerto", categoria: "del mar", aliases: ["parrilla del puerto"] },
  { nombre: "Salmón Mediterráneo", categoria: "salmon", aliases: ["salmon mediterraneo", "salmón mediterráneo"] },
  { nombre: "Salmón Nuquí", categoria: "salmon", aliases: ["salmon nuqui", "salmón nuquí", "salmón nuqui"] },
  { nombre: "Salmón Entre Mares", categoria: "salmon", aliases: ["salmon entre mares", "salmón entre mares"] },
  { nombre: "Trucha Buenaventura", categoria: "trucha", aliases: ["trucha buenaventura"] },
  { nombre: "Trucha al Ajillo", categoria: "trucha", aliases: ["trucha al ajillo"] },

  // Frapeadas
  { nombre: "Cerezada", categoria: "frapeada", aliases: ["cerezada"] },
  { nombre: "Limolulada", categoria: "frapeada", aliases: ["limolulada"] },
  { nombre: "Manguito Biche", categoria: "frapeada", aliases: ["manguito biche"] },
  { nombre: "Malí", categoria: "frapeada", aliases: ["mali", "malí"] },
  { nombre: "Patillal", categoria: "frapeada", aliases: ["patillal"] },
  { nombre: "Limonada Natural", categoria: "frapeada", aliases: ["limonada natural"] },
  { nombre: "Limonada de Hierbabuena", categoria: "frapeada", aliases: ["limonada de hierbabuena"] },
  { nombre: "Guanabanazo", categoria: "frapeada", aliases: ["guanabanazo"] },
  { nombre: "Dulcito e' Coco", categoria: "frapeada", aliases: ["dulcito e coco", "dulcito de coco", "limonada de coco"] },
  { nombre: "Frapuccino", categoria: "frapeada", aliases: ["frapuccino"] },

  // Gaseosas / otros
  { nombre: "Ginger 400ML", categoria: "gaseosa", aliases: ["ginger", "ginger 400ml"] },
  { nombre: "Coca-Cola 400ML", categoria: "gaseosa", aliases: ["coca cola", "coca-cola", "coca cola 400ml"] },
  { nombre: "Coca-Cola Zero 400ML", categoria: "gaseosa", aliases: ["coca cola zero", "coca-cola zero"] },
  { nombre: "Kola Román 400ML", categoria: "gaseosa", aliases: ["kola roman", "kola román"] },
  { nombre: "Quatro 400ML", categoria: "gaseosa", aliases: ["quatro"] },
  { nombre: "Agua 300ML", categoria: "otro", aliases: ["agua 300ml", "agua pequeña"] },
  { nombre: "Agua 600ML", categoria: "otro", aliases: ["agua 600ml", "agua grande"] },
  { nombre: "Soda 300ML", categoria: "otro", aliases: ["soda 300ml", "soda"] },
  { nombre: "Agua Voss Carbonatada 375ML", categoria: "otro", aliases: ["agua voss carbonatada"] },
  { nombre: "Agua Voss 375ML", categoria: "otro", aliases: ["agua voss"] },

  // Micheladas
  { nombre: "Michelada Clásica", categoria: "michelada", aliases: ["michelada clasica", "michelada clásica", "clasica"] },
  { nombre: "Michelada Manzana Verde y Kiwi", categoria: "michelada", aliases: ["manzana verde y kiwi"] },
  { nombre: "Michelada Cereza y Arándanos", categoria: "michelada", aliases: ["cereza y arandanos", "cereza y arándanos"] },
  { nombre: "Michelada Mango Biche", categoria: "michelada", aliases: ["mango biche"] },
  { nombre: "Michelada Frutal", categoria: "michelada", aliases: ["frutal"] },

  // Cervezas
  { nombre: "Águila Light", categoria: "cerveza", aliases: ["aguila light", "águila light", "cerveza aguila light", "cerveza águila light"] },
  { nombre: "Águila Original", categoria: "cerveza", aliases: ["aguila original", "águila original", "cerveza aguila original"] },
  { nombre: "Budweiser", categoria: "cerveza", aliases: ["budweiser", "cerveza budweiser"] },
  { nombre: "Club Colombia Dorada", categoria: "cerveza", aliases: ["club colombia dorada", "club colombia"] },
  { nombre: "Coronita", categoria: "cerveza", aliases: ["coronita", "cerveza coronita"] },
  { nombre: "Heineken", categoria: "cerveza", aliases: ["heineken", "cerveza heineken"] },
  { nombre: "Póker", categoria: "cerveza", aliases: ["poker", "póker", "cerveza poker", "cerveza póker"] },
  { nombre: "Stella Artois", categoria: "cerveza", aliases: ["stella artois"] },

  // Cócteles
  { nombre: "Amanzour", categoria: "coctel", aliases: ["amanzour"] },
  { nombre: "Margarita Especial", categoria: "coctel", aliases: ["margarita especial"] },
  { nombre: "Margarita Tradicional", categoria: "coctel", aliases: ["margarita tradicional"] },
  { nombre: "Moscow Mule", categoria: "coctel", aliases: ["moscow mule"] },
  { nombre: "Gin Tonic", categoria: "coctel", aliases: ["gin tonic"] },
  { nombre: "Mojito Cubano", categoria: "coctel", aliases: ["mojito cubano"] },
  { nombre: "Aperol Spritz", categoria: "coctel", aliases: ["aperol spritz"] },
  { nombre: "Corozo Sunrise", categoria: "coctel", aliases: ["corozo sunrise"] },
  { nombre: "Mimosa", categoria: "coctel", aliases: ["mimosa"] },
  { nombre: "Paloma Especial", categoria: "coctel", aliases: ["paloma especial"] },
  { nombre: "Paloma Tradicional", categoria: "coctel", aliases: ["paloma tradicional"] },
  { nombre: "Cuba Libre", categoria: "coctel", aliases: ["cuba libre"] },

  // Calientes
  { nombre: "Capuccino", categoria: "caliente", aliases: ["capuccino", "capuchino"] },
  { nombre: "Latte", categoria: "caliente", aliases: ["latte"] },
  { nombre: "Americano", categoria: "caliente", aliases: ["americano"] },
  { nombre: "Tinto", categoria: "caliente", aliases: ["tinto"] },
  { nombre: "Espresso", categoria: "caliente", aliases: ["espresso"] },

  // Comidas rápidas
  { nombre: "Joaquin de Res", categoria: "hamburguesa", aliases: ["joaquin de res", "joaquín de res"] },
  { nombre: "Inmaculada", categoria: "hamburguesa", aliases: ["inmaculada"] },
  { nombre: "Zagrada Victoria", categoria: "hamburguesa", aliases: ["zagrada victoria"] },
  { nombre: "Trinidad", categoria: "hamburguesa", aliases: ["trinidad"] },
  { nombre: "Santa Cruz", categoria: "hamburguesa", aliases: ["santa cruz"] },
  { nombre: "Azteca", categoria: "hamburguesa", aliases: ["azteca"] },

  { nombre: "Rancheras", categoria: "papas", aliases: ["rancheras"] },
  { nombre: "Típicas", categoria: "papas", aliases: ["tipicas", "típicas"] },

  { nombre: "Fátima", categoria: "maicito", aliases: ["fatima", "fátima"] },
  { nombre: "San José", categoria: "maicito", aliases: ["san jose", "san josé"] }
];

const MENU_RESUMEN_IA = MENU_ITEMS
  .map((item) => `${item.nombre} [${item.categoria}]`)
  .join(", ");

module.exports = {
  MENU_ITEMS,
  MENU_RESUMEN_IA
};
// Navigation and smooth scrolling
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    section.scrollIntoView({ behavior: 'smooth' });
    updateActiveNav(sectionId);
}

function updateActiveNav(activeSection) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${activeSection}`) {
            link.classList.add('active');
        }
    });
}

// Tax Calculator
function calcularTributo() {
    const tipoTributo = document.getElementById('tipoTributo').value;
    const monto = parseFloat(document.getElementById('monto').value);
    const provincia = document.getElementById('provincia').value;
    const resultadoDiv = document.getElementById('resultado');

    if (!tipoTributo || !monto || monto <= 0) {
        resultadoDiv.innerHTML = '<p style="color: #dc3545;">Por favor complete todos los campos con valores válidos.</p>';
        return;
    }

    const tributosProvinciales = ['ingresos-brutos', 'automotor', 'inmobiliario', 'sellos', 'embarcaciones', 'energia-electrica', 'gas-natural'];
    const tributosMunicipales = ['seguridad-higiene', 'servicios-urbanos', 'construccion', 'alumbrado-publico'];
    
    if ((tributosProvinciales.includes(tipoTributo) || tributosMunicipales.includes(tipoTributo)) && !provincia) {
        resultadoDiv.innerHTML = '<p style="color: #dc3545;">Por favor seleccione una provincia para este tipo de tributo.</p>';
        return;
    }

    let resultado = calcularTributoEspecifico(tipoTributo, monto, provincia);
    
    const montoFormateado = formatCurrency(monto);
    const tributoFormateado = formatCurrency(resultado.impuesto);
    const totalFormateado = formatCurrency(monto + resultado.impuesto);

    resultadoDiv.innerHTML = `
        <div style="padding: 1rem; background: #f8f9fa; border-radius: 5px; margin-bottom: 1rem;">
            <h4 style="color: #1e3c72; margin-bottom: 1rem;">${resultado.descripcion}</h4>
            <div style="display: grid; gap: 0.5rem;">
                <div><strong>Monto Base:</strong> ${montoFormateado}</div>
                <div><strong>Alícuota Aplicada:</strong> <span style="color: #28a745; font-weight: bold;">${resultado.alicuota}</span></div>
                <div><strong>Tributo Calculado:</strong> <span style="color: #28a745; font-weight: bold;">${tributoFormateado}</span></div>
                <div style="border-top: 1px solid #dee2e6; padding-top: 0.5rem; margin-top: 0.5rem;">
                    <strong>Total a Pagar:</strong> <span style="color: #1e3c72; font-weight: bold;">${totalFormateado}</span>
                </div>
            </div>
            <p style="color: #666; margin-top: 1rem; font-size: 0.9rem;">${resultado.detalles}</p>
            ${resultado.provinciaMenor ? `
                <div style="background: #d1ecf1; padding: 0.8rem; border-radius: 5px; margin-top: 1rem; border-left: 4px solid #bee5eb;">
                    <small><strong>💡 Dato útil:</strong> La provincia con menor alícuota para este tributo es <strong>${resultado.provinciaMenor.nombre}</strong> con ${resultado.provinciaMenor.alicuota}%</small>
                </div>
            ` : ''}
        </div>
        <div style="padding: 1rem; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
            <small><strong>Nota:</strong> Este cálculo es orientativo. Consulte la normativa vigente para el cálculo exacto.</small>
        </div>
    `;
}

function calcularTributoEspecifico(tipo, monto, provincia) {
    const calculadores = {
        // Tributos Nacionales
        'ganancias': () => calcularGanancias(monto),
        'iva': () => ({ impuesto: monto * 0.21, alicuota: '21%', descripcion: 'IVA (21%)', detalles: 'Alícuota general aplicable' }),
        'bienes-personales': () => calcularBienesPersonales(monto),
        'debitos-creditos': () => ({ impuesto: monto * 0.006, alicuota: '0.6%', descripcion: 'Débitos y Créditos Bancarios', detalles: 'Alícuota general sobre movimientos bancarios' }),
        'monotributo': () => calcularMonotributo(monto),
        'internos': () => ({ impuesto: monto * 0.15, alicuota: '15%', descripcion: 'Impuestos Internos', detalles: 'Variable según producto' }),
        
        // Tributos Provinciales
        'ingresos-brutos': () => calcularIngresosBrutos(monto, provincia),
        'automotor': () => calcularAutomotor(monto, provincia),
        'inmobiliario': () => calcularInmobiliario(monto, provincia),
        'sellos': () => calcularSellos(monto, provincia),
        'embarcaciones': () => calcularEmbarcaciones(monto, provincia),
        'energia-electrica': () => calcularEnergiaElectrica(monto, provincia),
        
        // Tributos Municipales
        'seguridad-higiene': () => calcularSeguridadHigiene(monto, provincia),
        'servicios-urbanos': () => calcularServiciosUrbanos(monto, provincia),
        'construccion': () => calcularConstruccion(monto, provincia),
        'alumbrado-publico': () => calcularAlumbradoPublico(monto, provincia),
        
        // Contribuciones Especiales
        'aportes-jubilatorios': () => ({ impuesto: monto * 0.11, alicuota: '11%', descripcion: 'Aportes Jubilatorios', detalles: 'Contribución empleado' }),
        'obra-social': () => ({ impuesto: monto * 0.03, alicuota: '3%', descripcion: 'Obra Social', detalles: 'Aporte empleado' }),
        'art': () => ({ impuesto: monto * 0.015, alicuota: '1.5%', descripcion: 'ART', detalles: 'Promedio según actividad' }),
        
        // Default para otros tributos
        'default': () => ({ impuesto: monto * 0.02, alicuota: '2%', descripcion: 'Tributo General', detalles: 'Tasa estimada general' })
    };
    
    const calculador = calculadores[tipo] || calculadores['default'];
    return calculador();
}

// Funciones adicionales para nuevos tributos
function calcularGanancias(monto) {
    // 2025 Updated rates and minimum amounts
    if (monto <= 2800000) return { impuesto: 0, alicuota: '0%', descripcion: 'Exento - Mínimo no imponible 2025', detalles: 'Escala progresiva según ingresos anuales - Actualizado 2025' };
    if (monto <= 4200000) return { impuesto: (monto - 2800000) * 0.05, alicuota: '5%', descripcion: 'Impuesto a las Ganancias 2025', detalles: 'Primera escala - Actualizado 2025' };
    if (monto <= 5600000) return { impuesto: 70000 + (monto - 4200000) * 0.09, alicuota: '9%', descripcion: 'Impuesto a las Ganancias 2025', detalles: 'Segunda escala - Actualizado 2025' };
    if (monto <= 7000000) return { impuesto: 196000 + (monto - 5600000) * 0.12, alicuota: '12%', descripcion: 'Impuesto a las Ganancias 2025', detalles: 'Tercera escala - Actualizado 2025' };
    if (monto <= 8400000) return { impuesto: 364000 + (monto - 7000000) * 0.15, alicuota: '15%', descripcion: 'Impuesto a las Ganancias 2025', detalles: 'Cuarta escala - Actualizado 2025' };
    if (monto <= 11200000) return { impuesto: 574000 + (monto - 8400000) * 0.19, alicuota: '19%', descripcion: 'Impuesto a las Ganancias 2025', detalles: 'Quinta escala - Actualizado 2025' };
    if (monto <= 14000000) return { impuesto: 1106000 + (monto - 11200000) * 0.23, alicuota: '23%', descripcion: 'Impuesto a las Ganancias 2025', detalles: 'Sexta escala - Actualizado 2025' };
    if (monto <= 16800000) return { impuesto: 1750000 + (monto - 14000000) * 0.27, alicuota: '27%', descripcion: 'Impuesto a las Ganancias 2025', detalles: 'Séptima escala - Actualizado 2025' };
    if (monto <= 22400000) return { impuesto: 2506000 + (monto - 16800000) * 0.31, alicuota: '31%', descripcion: 'Impuesto a las Ganancias 2025', detalles: 'Octava escala - Actualizado 2025' };
    return { impuesto: 4242000 + (monto - 22400000) * 0.35, alicuota: '35%', descripcion: 'Impuesto a las Ganancias 2025', detalles: 'Escala máxima - Actualizado 2025' };
}

function calcularBienesPersonales(monto) {
    // 2025 Updated minimum and rates
    if (monto <= 27000000) return { impuesto: 0, alicuota: '0%', descripcion: 'Exento - Mínimo no imponible 2025', detalles: 'Patrimonio inferior al mínimo actualizado 2025' };
    if (monto <= 50000000) return { impuesto: (monto - 27000000) * 0.005, alicuota: '0.5%', descripcion: 'Bienes Personales 2025', detalles: 'Primera escala - Actualizado 2025' };
    if (monto <= 100000000) return { impuesto: 115000 + (monto - 50000000) * 0.0075, alicuota: '0.75%', descripcion: 'Bienes Personales 2025', detalles: 'Segunda escala - Actualizado 2025' };
    if (monto <= 300000000) return { impuesto: 490000 + (monto - 100000000) * 0.01, alicuota: '1%', descripcion: 'Bienes Personales 2025', detalles: 'Tercera escala - Actualizado 2025' };
    return { impuesto: 2490000 + (monto - 300000000) * 0.0125, alicuota: '1.25%', descripcion: 'Bienes Personales 2025', detalles: 'Escala máxima - Actualizado 2025' };
}

function calcularMonotributo(monto) {
    // 2025 Updated categories and amounts
    if (monto <= 650000) return { impuesto: 8500, alicuota: 'Fijo', descripcion: 'Monotributo Categoría A - 2025', detalles: 'Cuota fija mensual actualizada 2025' };
    if (monto <= 950000) return { impuesto: 14200, alicuota: 'Fijo', descripcion: 'Monotributo Categoría B - 2025', detalles: 'Cuota fija mensual actualizada 2025' };
    if (monto <= 1300000) return { impuesto: 19800, alicuota: 'Fijo', descripcion: 'Monotributo Categoría C - 2025', detalles: 'Cuota fija mensual actualizada 2025' };
    if (monto <= 1700000) return { impuesto: 26500, alicuota: 'Fijo', descripcion: 'Monotributo Categoría D - 2025', detalles: 'Cuota fija mensual actualizada 2025' };
    if (monto <= 2100000) return { impuesto: 33200, alicuota: 'Fijo', descripcion: 'Monotributo Categoría E - 2025', detalles: 'Cuota fija mensual actualizada 2025' };
    if (monto <= 2600000) return { impuesto: 41800, alicuota: 'Fijo', descripcion: 'Monotributo Categoría F - 2025', detalles: 'Cuota fija mensual actualizada 2025' };
    if (monto <= 3100000) return { impuesto: 56200, alicuota: 'Fijo', descripcion: 'Monotributo Categoría G - 2025', detalles: 'Cuota fija mensual actualizada 2025' };
    if (monto <= 3600000) return { impuesto: 89500, alicuota: 'Fijo', descripcion: 'Monotributo Categoría H - 2025', detalles: 'Cuota fija mensual actualizada 2025' };
    return { impuesto: monto * 0.35, alicuota: '35%', descripcion: 'Régimen General - Excede Monotributo 2025', detalles: 'Debe tributar en Régimen General' };
}

// Funciones específicas de cálculo con información de provincia menor - Updated 2025
function calcularIngresosBrutos(monto, provincia) {
    const provincias = {
        'buenos-aires': { alicuota: 0.042, nombre: 'Buenos Aires' },
        'catamarca': { alicuota: 0.037, nombre: 'Catamarca' },
        'chaco': { alicuota: 0.040, nombre: 'Chaco' },
        'chubut': { alicuota: 0.034, nombre: 'Chubut' },
        'cordoba': { alicuota: 0.037, nombre: 'Córdoba' },
        'corrientes': { alicuota: 0.038, nombre: 'Corrientes' },
        'entre-rios': { alicuota: 0.039, nombre: 'Entre Ríos' },
        'formosa': { alicuota: 0.036, nombre: 'Formosa' },
        'jujuy': { alicuota: 0.035, nombre: 'Jujuy' },
        'la-pampa': { alicuota: 0.038, nombre: 'La Pampa' },
        'la-rioja': { alicuota: 0.037, nombre: 'La Rioja' },
        'mendoza': { alicuota: 0.040, nombre: 'Mendoza' },
        'misiones': { alicuota: 0.036, nombre: 'Misiones' },
        'neuquen': { alicuota: 0.041, nombre: 'Neuquén' },
        'rio-negro': { alicuota: 0.039, nombre: 'Río Negro' },
        'salta': { alicuota: 0.038, nombre: 'Salta' },
        'san-juan': { alicuota: 0.037, nombre: 'San Juan' },
        'san-luis': { alicuota: 0.036, nombre: 'San Luis' },
        'santa-cruz': { alicuota: 0.035, nombre: 'Santa Cruz' },
        'santa-fe': { alicuota: 0.040, nombre: 'Santa Fe' },
        'santiago-del-estero': { alicuota: 0.037, nombre: 'Santiago del Estero' },
        'tierra-del-fuego': { alicuota: 0.032, nombre: 'Tierra del Fuego' },
        'tucuman': { alicuota: 0.037, nombre: 'Tucumán' },
        'caba': { alicuota: 0.047, nombre: 'Ciudad Autónoma de Buenos Aires' }
    };
    
    const provinciaData = provincias[provincia] || { alicuota: 0.037, nombre: 'No especificada' };
    const menorAlicuota = Math.min(...Object.values(provincias).map(p => p.alicuota));
    const provinciaMenor = Object.values(provincias).find(p => p.alicuota === menorAlicuota);
    
    return {
        impuesto: monto * provinciaData.alicuota,
        alicuota: (provinciaData.alicuota * 100).toFixed(1) + '%',
        descripcion: 'Ingresos Brutos 2025',
        detalles: `Alícuota actualizada 2025 de ${provinciaData.nombre}: ${(provinciaData.alicuota * 100).toFixed(1)}%`,
        provinciaMenor: {
            nombre: provinciaMenor.nombre,
            alicuota: (provinciaMenor.alicuota * 100).toFixed(1)
        }
    };
}

function calcularAutomotor(valorFiscal, provincia) {
    const provincias = {
        'buenos-aires': { alicuota: 0.027, nombre: 'Buenos Aires' },
        'catamarca': { alicuota: 0.022, nombre: 'Catamarca' },
        'chaco': { alicuota: 0.024, nombre: 'Chaco' },
        'chubut': { alicuota: 0.020, nombre: 'Chubut' },
        'cordoba': { alicuota: 0.025, nombre: 'Córdoba' },
        'corrientes': { alicuota: 0.023, nombre: 'Corrientes' },
        'entre-rios': { alicuota: 0.026, nombre: 'Entre Ríos' },
        'formosa': { alicuota: 0.021, nombre: 'Formosa' },
        'jujuy': { alicuota: 0.022, nombre: 'Jujuy' },
        'la-pampa': { alicuota: 0.024, nombre: 'La Pampa' },
        'la-rioja': { alicuota: 0.023, nombre: 'La Rioja' },
        'mendoza': { alicuota: 0.026, nombre: 'Mendoza' },
        'misiones': { alicuota: 0.022, nombre: 'Misiones' },
        'neuquen': { alicuota: 0.028, nombre: 'Neuquén' },
        'rio-negro': { alicuota: 0.025, nombre: 'Río Negro' },
        'salta': { alicuota: 0.024, nombre: 'Salta' },
        'san-juan': { alicuota: 0.023, nombre: 'San Juan' },
        'san-luis': { alicuota: 0.022, nombre: 'San Luis' },
        'santa-cruz': { alicuota: 0.021, nombre: 'Santa Cruz' },
        'santa-fe': { alicuota: 0.027, nombre: 'Santa Fe' },
        'santiago-del-estero': { alicuota: 0.023, nombre: 'Santiago del Estero' },
        'tierra-del-fuego': { alicuota: 0.019, nombre: 'Tierra del Fuego' },
        'tucuman': { alicuota: 0.024, nombre: 'Tucumán' },
        'caba': { alicuota: 0.030, nombre: 'Ciudad Autónoma de Buenos Aires' }
    };
    
    const provinciaData = provincias[provincia] || { alicuota: 0.024, nombre: 'No especificada' };
    const menorAlicuota = Math.min(...Object.values(provincias).map(p => p.alicuota));
    const provinciaMenor = Object.values(provincias).find(p => p.alicuota === menorAlicuota);
    
    return {
        impuesto: valorFiscal * provinciaData.alicuota,
        alicuota: (provinciaData.alicuota * 100).toFixed(1) + '%',
        descripcion: 'Impuesto Automotor 2025',
        detalles: `Calculado sobre valor fiscal actualizado 2025 - ${provinciaData.nombre}`,
        provinciaMenor: {
            nombre: provinciaMenor.nombre,
            alicuota: (provinciaMenor.alicuota * 100).toFixed(1)
        }
    };
}

function calcularInmobiliario(valuacion, provincia) {
    const provincias = {
        'buenos-aires': { alicuota: 0.014, nombre: 'Buenos Aires' },
        'catamarca': { alicuota: 0.010, nombre: 'Catamarca' },
        'chaco': { alicuota: 0.011, nombre: 'Chaco' },
        'chubut': { alicuota: 0.009, nombre: 'Chubut' },
        'cordoba': { alicuota: 0.012, nombre: 'Córdoba' },
        'corrientes': { alicuota: 0.011, nombre: 'Corrientes' },
        'entre-rios': { alicuota: 0.013, nombre: 'Entre Ríos' },
        'formosa': { alicuota: 0.010, nombre: 'Formosa' },
        'jujuy': { alicuota: 0.011, nombre: 'Jujuy' },
        'la-pampa': { alicuota: 0.012, nombre: 'La Pampa' },
        'la-rioja': { alicuota: 0.011, nombre: 'La Rioja' },
        'mendoza': { alicuota: 0.013, nombre: 'Mendoza' },
        'misiones': { alicuota: 0.010, nombre: 'Misiones' },
        'neuquen': { alicuota: 0.015, nombre: 'Neuquén' },
        'rio-negro': { alicuota: 0.012, nombre: 'Río Negro' },
        'salta': { alicuota: 0.011, nombre: 'Salta' },
        'san-juan': { alicuota: 0.011, nombre: 'San Juan' },
        'san-luis': { alicuota: 0.010, nombre: 'San Luis' },
        'santa-cruz': { alicuota: 0.009, nombre: 'Santa Cruz' },
        'santa-fe': { alicuota: 0.014, nombre: 'Santa Fe' },
        'santiago-del-estero': { alicuota: 0.011, nombre: 'Santiago del Estero' },
        'tierra-del-fuego': { alicuota: 0.008, nombre: 'Tierra del Fuego' },
        'tucuman': { alicuota: 0.012, nombre: 'Tucumán' },
        'caba': { alicuota: 0.017, nombre: 'Ciudad Autónoma de Buenos Aires' }
    };
    
    const provinciaData = provincias[provincia] || { alicuota: 0.012, nombre: 'No especificada' };
    const menorAlicuota = Math.min(...Object.values(provincias).map(p => p.alicuota));
    const provinciaMenor = Object.values(provincias).find(p => p.alicuota === menorAlicuota);
    
    return {
        impuesto: valuacion * provinciaData.alicuota,
        alicuota: (provinciaData.alicuota * 100).toFixed(1) + '%',
        descripcion: 'Impuesto Inmobiliario 2025',
        detalles: `Calculado sobre valuación fiscal actualizada 2025 - ${provinciaData.nombre}`,
        provinciaMenor: {
            nombre: provinciaMenor.nombre,
            alicuota: (provinciaMenor.alicuota * 100).toFixed(1)
        }
    };
}

// Funciones para tributos provinciales adicionales
function calcularSellos(monto, provincia) {
    const alicuota = 0.01; // 1% promedio
    return {
        impuesto: monto * alicuota,
        alicuota: '1%',
        descripcion: 'Impuesto de Sellos',
        detalles: `Sobre actos y contratos - ${provincia || 'General'}`
    };
}

function calcularEmbarcaciones(monto, provincia) {
    const alicuota = 0.015; // 1.5%
    return {
        impuesto: monto * alicuota,
        alicuota: '1.5%',
        descripcion: 'Embarcaciones de Recreo',
        detalles: `Sobre valor fiscal de la embarcación - ${provincia || 'General'}`
    };
}

function calcularEnergiaElectrica(monto, provincia) {
    const alicuota = 0.08; // 8%
    return {
        impuesto: monto * alicuota,
        alicuota: '8%',
        descripcion: 'Impuesto Energía Eléctrica',
        detalles: `Sobre consumo eléctrico - ${provincia || 'General'}`
    };
}

// Funciones para tributos municipales
function calcularSeguridadHigiene(monto, provincia) {
    const alicuota = 0.0035; // Updated to 0.35% for 2025
    return {
        impuesto: monto * alicuota,
        alicuota: '0.35%',
        descripcion: 'Tasa Seguridad e Higiene 2025',
        detalles: `Sobre actividad comercial actualizada 2025 - ${provincia || 'General'}`
    };
}

function calcularServiciosUrbanos(monto, provincia) {
    const impuestoFijo = 4500; // Updated amount for 2025
    return {
        impuesto: impuestoFijo,
        alicuota: 'Fijo',
        descripcion: 'Servicios Urbanos 2025',
        detalles: `Tasa fija bimestral actualizada 2025 - ${provincia || 'General'}`
    };
}

function calcularConstruccion(monto, provincia) {
    const alicuota = 0.018; // Updated to 1.8% for 2025
    return {
        impuesto: monto * alicuota,
        alicuota: '1.8%',
        descripcion: 'Derechos de Construcción 2025',
        detalles: `Sobre presupuesto de obra actualizado 2025 - ${provincia || 'General'}`
    };
}

function calcularAlumbradoPublico(monto, provincia) {
    const impuestoFijo = 1200; // Updated amount for 2025
    return {
        impuesto: impuestoFijo,
        alicuota: 'Fijo',
        descripcion: 'Alumbrado Público 2025',
        detalles: `Tasa fija bimestral actualizada 2025 - ${provincia || 'General'}`
    };
}

// Municipality information display
function mostrarMunicipio() {
    const municipio = document.getElementById('municipioSelect').value;
    const infoDiv = document.getElementById('municipio-info');
    const verMasContainer = document.getElementById('ver-mas-municipales');
    
    const municipiosInfo = {
        'capital': {
            nombre: 'San Miguel de Tucumán (Capital)',
            tributos: [
                'Tasa de Inspección de Seguridad e Higiene: 2.5‰ sobre ingresos brutos',
                'Derecho de Registro e Inspección: Según actividad',
                'Tasa por Servicios Urbanos: Variable según zona',
                'Contribución por Mejoras: Según obras públicas'
            ],
            contacto: 'Tel: (0381) 427-5000 - municipalidadcapital@tucuman.gov.ar'
        },
        'yerba-buena': {
            nombre: 'Yerba Buena',
            tributos: [
                'Tasa de Inspección de Seguridad e Higiene: 2‰ sobre ingresos brutos',
                'Derecho de Registro e Inspección: $5.000 - $15.000',
                'Tasa por Servicios Urbanos: $2.000 - $8.000 bimestral',
                'Tasa de Habilitación Comercial: Según superficie'
            ],
            contacto: 'Tel: (0381) 425-8800 - info@yerbabuena.gov.ar'
        },
        'tafi-viejo': {
            nombre: 'Tafí Viejo',
            tributos: [
                'Tasa de Inspección de Seguridad e Higiene: 2.5‰ sobre ingresos brutos',
                'Derecho de Registro e Inspección: $3.000 - $12.000',
                'Tasa por Servicios Urbanos: $1.500 - $6.000 bimestral',
                'Patente de Rodados: 0.5% del valor fiscal'
            ],
            contacto: 'Tel: (0381) 423-6000 - municipio@tafiviejo.gov.ar'
        },
        'banda-rio-sali': {
            nombre: 'Banda del Río Salí',
            tributos: [
                'Tasa de Inspección de Seguridad e Higiene: 2‰ sobre ingresos brutos',
                'Derecho de Registro e Inspección: $4.000 - $10.000',
                'Tasa por Servicios Urbanos: $1.800 - $5.500 bimestral',
                'Contribución Inmobiliaria: 0.8% del valor fiscal'
            ],
            contacto: 'Tel: (0381) 427-3200 - info@bandariosali.gov.ar'
        },
        'concepcion': {
            nombre: 'Concepción',
            tributos: [
                'Tasa de Inspección de Seguridad e Higiene: 2.2‰ sobre ingresos brutos',
                'Derecho de Registro e Inspección: $2.500 - $8.000',
                'Tasa por Servicios Urbanos: $1.200 - $4.000 bimestral',
                'Tasa de Alumbrado Público: $800 - $2.500 bimestral'
            ],
            contacto: 'Tel: (03865) 42-1000 - municipio@concepcion.gov.ar'
        },
        'lules': {
            nombre: 'Lules',
            tributos: [
                'Tasa de Inspección de Seguridad e Higiene: 2.3‰ sobre ingresos brutos',
                'Derecho de Registro e Inspección: $2.000 - $7.000',
                'Tasa por Servicios Urbanos: $1.000 - $3.500 bimestral',
                'Patente Única de Rodados: 0.4% del valor fiscal'
            ],
            contacto: 'Tel: (0381) 427-8500 - info@lules.gov.ar'
        }
    };

    if (municipio && municipiosInfo[municipio]) {
        const info = municipiosInfo[municipio];
        infoDiv.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.08);">
                <h3 style="color: #1e3c72; margin-bottom: 1.5rem; font-weight: 600;">${info.nombre}</h3>
                <div style="margin-bottom: 2rem;">
                    <h4 style="color: #28a745; margin-bottom: 1rem;">Principales Tributos Municipales:</h4>
                    <ul style="list-style: none; padding: 0;">
                        ${info.tributos.map(tributo => `
                            <li style="padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0; position: relative; padding-left: 1.5rem;">
                                <span style="position: absolute; left: 0; color: #28a745; font-weight: bold;">•</span>
                                ${tributo}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 5px; border-left: 4px solid #28a745;">
                    <h5 style="color: #1e3c72; margin-bottom: 0.5rem;">Información de Contacto:</h5>
                    <p style="margin: 0; color: #666;">${info.contacto}</p>
                </div>
            </div>
        `;
    } else {
        infoDiv.innerHTML = '<p>Seleccione un municipio para ver la información tributaria específica</p>';
    }
    
    // Show or hide Ver Más button
    if (municipio) {
        verMasContainer.style.display = 'block';
    } else {
        verMasContainer.style.display = 'none';
    }
}

// Rotating banner content
const tributosInfo = [
    {
        categoria: "Tributos Nacionales 2025",
        items: [
            { nombre: "IVA General", tasa: "21%" },
            { nombre: "IVA Reducido", tasa: "10.5%" },
            { nombre: "Ganancias Sociedades", tasa: "35%" }
        ]
    },
    {
        categoria: "Ingresos Brutos - Tucumán 2025",
        items: [
            { nombre: "Comercio", tasa: "3.5% - 5.5%" },
            { nombre: "Industria", tasa: "1.2% - 3.2%" },
            { nombre: "Servicios Profesionales", tasa: "4% - 8%" }
        ]
    },
    {
        categoria: "Impuestos Provinciales 2025",
        items: [
            { nombre: "Inmobiliario Urbano", tasa: "0.6% - 1.8%" },
            { nombre: "Inmobiliario Rural", tasa: "0.4% - 1.2%" },
            { nombre: "Automotor", tasa: "1.8% - 3.2%" }
        ]
    },
    {
        categoria: "Tributos Municipales 2025",
        items: [
            { nombre: "Seguridad e Higiene", tasa: "2.5‰ - 4‰" },
            { nombre: "Servicios Urbanos", tasa: "$3.500 - $12.000" },
            { nombre: "Habilitación Comercial", tasa: "$8.000 - $25.000" }
        ]
    },
    {
        categoria: "Ganancias Personas Físicas 2025",
        items: [
            { nombre: "Mínimo No Imponible", tasa: "$2.800.000" },
            { nombre: "Primera Escala", tasa: "5%" },
            { nombre: "Escala Máxima", tasa: "35%" }
        ]
    },
    {
        categoria: "Bienes Personales 2025",
        items: [
            { nombre: "Mínimo No Imponible", tasa: "$27.000.000" },
            { nombre: "Alícuota Mínima", tasa: "0.5%" },
            { nombre: "Alícuota Máxima", tasa: "1.75%" }
        ]
    },
    {
        categoria: "Monotributo 2025",
        items: [
            { nombre: "Categoría A", tasa: "$8.500 mensual" },
            { nombre: "Categoría B", tasa: "$14.200 mensual" },
            { nombre: "Categoría H", tasa: "$89.500 mensual" }
        ]
    },
    {
        categoria: "Contribuciones Sociales 2025",
        items: [
            { nombre: "Aportes Jubilatorios", tasa: "11%" },
            { nombre: "Obra Social", tasa: "3%" },
            { nombre: "Seguro de Vida", tasa: "1.5%" }
        ]
    },
    {
        categoria: "Impuestos Internos 2025",
        items: [
            { nombre: "Bebidas Alcohólicas", tasa: "20%" },
            { nombre: "Cigarrillos", tasa: "75%" },
            { nombre: "Automóviles Lujo", tasa: "20%" }
        ]
    },
    {
        categoria: "Tasas Especiales 2025",
        items: [
            { nombre: "Débitos y Créditos", tasa: "0.6%" },
            { nombre: "Combustibles Líquidos", tasa: "$85/litro" },
            { nombre: "Energía Eléctrica", tasa: "8% - 12%" }
        ]
    }
];

let currentInfoIndex = 0;

function updateRotatingInfo() {
    const container = document.getElementById('rotating-content');
    if (!container) return;
    
    const currentInfo = tributosInfo[currentInfoIndex];
    
    const html = `
        <h4>${currentInfo.categoria}</h4>
        ${currentInfo.items.map(item => `
            <div class="tributo-item">
                <span class="tributo-name">${item.nombre}</span>
                <span class="tributo-rate">Tasa: <span class="highlight">${item.tasa}</span></span>
            </div>
        `).join('')}
    `;
    
    container.innerHTML = html;
    
    // Move to next info set
    currentInfoIndex = (currentInfoIndex + 1) % tributosInfo.length;
}

// Initialize rotating content
function initializeRotatingBanner() {
    updateRotatingInfo();
    setInterval(updateRotatingInfo, 5000); // Change every 5 seconds
}

// Navigation scroll spy
window.addEventListener('scroll', () => {
    const sections = ['inicio', 'presentacion', 'calculadora', 'nacionales', 'provinciales', 'municipales', 'equipo'];
    const scrollPos = window.scrollY + 100;

    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                updateActiveNav(sectionId);
            }
        }
    });
});

// Modal functionality
function openModal(section) {
    const modal = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    
    // Set modal title
    switch(section) {
        case 'nacionales':
            modalTitle.textContent = 'Tributos Nacionales - Lista Completa';
            modalContent.innerHTML = getTributosNacionalesContent();
            break;
        case 'provinciales':
            modalTitle.textContent = 'Tributos Provinciales - Tucumán';
            modalContent.innerHTML = getTributosProvincialesContent();
            break;
        case 'municipales':
            const municipio = document.getElementById('municipioSelect').value;
            const municipioNombre = municipio ? document.getElementById('municipioSelect').selectedOptions[0].text : 'General';
            modalTitle.textContent = `Tributos Municipales - ${municipioNombre}`;
            modalContent.innerHTML = getTributosMunicipalesContent(municipio);
            break;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('modal-overlay');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Modal content generators
function getTributosNacionalesContent() {
    return `
        <div class="modal-tributos-grid">
            <div class="modal-tributo-card">
                <h4>Impuesto a las Ganancias</h4>
                <p>Gravamen sobre las ganancias obtenidas por personas físicas y jurídicas.</p>
                <ul>
                    <li>Personas Físicas: Escala progresiva 5% a 35%</li>
                    <li>Sociedades: 30% sobre utilidades</li>
                    <li>No residentes: 35%</li>
                    <li>Mínimo no imponible 2024: $225.000</li>
                </ul>
            </div>
            <div class="modal-tributo-card">
                <h4>Impuesto al Valor Agregado (IVA)</h4>
                <p>Tributo sobre el valor agregado en cada etapa de comercialización.</p>
                <ul>
                    <li>Alícuota General: 21%</li>
                    <li>Alícuota Reducida: 10.5%</li>
                    <li>Exentos: Libros, medicamentos</li>
                    <li>No Gravados: Exportaciones</li>
                </ul>
            </div>
            <div class="modal-tributo-card">
                <h4>Impuesto a los Bienes Personales</h4>
                <p>Gravamen anual sobre el patrimonio neto de personas físicas.</p>
                <ul>
                    <li>Mínimo no imponible: $6.000.000</li>
                    <li>Alícuotas: 0.5% al 1.25%</li>
                    <li>Bienes en el país y exterior</li>
                    <li>Vencimiento: 31 de diciembre</li>
                </ul>
            </div>
            <div class="modal-tributo-card">
                <h4>Impuesto a los Débitos y Créditos</h4>
                <p>Gravamen sobre movimientos en cuentas bancarias.</p>
                <ul>
                    <li>Alícuota General: 0.6%</li>
                    <li>Cuenta Sueldo: 0.4%</li>
                    <li>Caja de Ahorro: 0.6%</li>
                    <li>Exenciones para jubilados</li>
                </ul>
            </div>
            <div class="modal-tributo-card">
                <h4>Impuesto a la Ganancia Mínima Presunta</h4>
                <p>Tributo mínimo sobre activos empresariales.</p>
                <ul>
                    <li>Alícuota: 1% anual sobre activos</li>
                    <li>Mínimo no imponible: $200.000</li>
                    <li>Pago a cuenta de Ganancias</li>
                    <li>Anticipos trimestrales</li>
                </ul>
            </div>
            <div class="modal-tributo-card">
                <h4>Impuesto a los Combustibles Líquidos</h4>
                <p>Gravamen específico sobre combustibles derivados del petróleo.</p>
                <ul>
                    <li>Nafta Super: Variable por litro</li>
                    <li>Gasoil: Variable por litro</li>
                    <li>Actualización mensual por inflación</li>
                    <li>Destino: Infraestructura vial</li>
                </ul>
            </div>
            <div class="modal-tributo-card">
                <h4>Derechos de Importación</h4>
                <p>Aranceles sobre mercaderías importadas.</p>
                <ul>
                    <li>Variable según nomenclador arancelario</li>
                    <li>Rango: 0% a 35%</li>
                    <li>Derechos específicos adicionales</li>
                    <li>Preferencias arancelarias</li>
                </ul>
            </div>
            <div class="modal-tributo-card">
                <h4>Impuesto a las Transacciones Financieras</h4>
                <p>Gravamen sobre operaciones financieras específicas.</p>
                <ul>
                    <li>Compra de divisas: 30%</li>
                    <li>Servicios digitales: 8%</li>
                    <li>Turismo exterior: 30%</li>
                    <li>Percepción en tarjetas</li>
                </ul>
            </div>
        </div>
    `;
}

function getTributosProvincialesContent() {
    return `
        <div class="modal-tributos-grid">
            <div class="modal-tributo-card">
                <h4>Impuesto sobre los Ingresos Brutos</h4>
                <p>Principal tributo provincial sobre actividades económicas.</p>
                <ul>
                    <li>Comercio: 3% - 5%</li>
                    <li>Industria: 1% - 3%</li>
                    <li>Servicios: 3% - 7%</li>
                    <li>Construcción: 3.5%</li>
                </ul>
            </div>
            <div class="modal-tributo-card">
                <h4>Impuesto Inmobiliario</h4>
                <p>Tributo anual sobre la propiedad inmobiliaria.</p>
                <ul>
                    <li>Urbanos: 0.5% - 1.5% de valuación fiscal</li>
                    <li>Rurales: 0.3% - 1% de valuación fiscal</li>
                    <li>Baldíos: Recargo del 50%</li>
                    <li>Descuentos por pago anual</li>
                </ul>
            </div>
            <div class="modal-tributo-card">
                <h4>Impuesto a los Automotores</h4>
                <p>Tributo anual sobre vehículos automotores.</p>
                <ul>
                    <li>Según año, modelo y cilindrada</li>
                    <li>Descuentos por antigüedad</li>
                    <li>Bonificación pago anticipado: 10%</li>
                    <li>Exentos: Vehículos +20 años</li>
                </ul>
            </div>
            <div class="modal-tributo-card">
                <h4>Impuesto de Sellos</h4>
                <p>Gravamen sobre actos y contratos onerosos.</p>
                <ul>
                    <li>Contratos en general: 0.5% - 1.2%</li>
                    <li>Títulos de crédito: 0.5%</li>
                    <li>Instrumentos públicos: Variable</li>
                    <li>Exentos: Contratos de trabajo</li>
                </ul>
            </div>
            <div class="modal-tributo-card">
                <h4>Tasa Vial Provincial</h4>
                <p>Contribución para mantenimiento vial.</p>
                <ul>
                    <li>Combustibles: Monto fijo por litro</li>
                    <li>Actualización trimestral</li>
                    <li>Destino específico: Red vial</li>
                    <li>Recaudación en estaciones de servicio</li>
                </ul>
            </div>
            <div class="modal-tributo-card">
                <h4>Impuesto a las Embarcaciones</h4>
                <p>Tributo sobre embarcaciones de recreo.</p>
                <ul>
                    <li>Según eslora y año de fabricación</li>
                    <li>Mínimo anual: $5.000</li>
                    <li>Descuentos por antigüedad</li>
                    <li>Exentas: Embarcaciones de pesca</li>
                </ul>
            </div>
            <div class="modal-tributo-card">
                <h4>Contribución Especial sobre Capital</h4>
                <p>Tributo adicional sobre grandes patrimonios.</p>
                <ul>
                    <li>Patrimonios superiores a $50.000.000</li>
                    <li>Alícuota: 0.75% anual</li>
                    <li>Pago semestral</li>
                    <li>Base: Patrimonio neto contable</li>
                </ul>
            </div>
            <div class="modal-tributo-card">
                <h4>Tasa de Justicia</h4>
                <p>Contribución por servicios del Poder Judicial.</p>
                <ul>
                    <li>Según tipo de actuación judicial</li>
                    <li>Monto fijo por expediente</li>
                    <li>Exentos: Causas laborales</li>
                    <li>Actualización anual</li>
                </ul>
            </div>
        </div>
    `;
}

function getTributosMunicipalesContent(municipio) {
    if (!municipio) {
        return `
            <div style="text-align: center; padding: 2rem;">
                <h3 style="color: #1e3c72; margin-bottom: 1rem;">Seleccione un Municipio</h3>
                <p>Por favor, seleccione un municipio específico para ver los tributos municipales detallados.</p>
            </div>
        `;
    }

    const baseContent = `
        <div class="modal-tributos-grid">
            <div class="modal-tributo-card">
                <h4>Tasa de Inspección de Seguridad e Higiene</h4>
                <p>Principal tributo municipal sobre actividades comerciales e industriales.</p>
                <ul>
                    <li>Alícuota: 2‰ - 3‰ sobre ingresos brutos</li>
                    <li>Mínimo mensual variable</li>
                    <li>Declaración jurada mensual</li>
                    <li>Descuentos por buen cumplimiento</li>
                </ul>
            </div>
            <div class="modal-tributo-card">
                <h4>Derecho de Registro e Inspección</h4>
                <p>Habilitación inicial para ejercer actividades comerciales.</p>
                <ul>
                    <li>Monto único según actividad</li>
                    <li>Renovación anual</li>
                    <li>Inspección previa obligatoria</li>
                    <li>Variable según superficie local</li>
                </ul>
            </div>
            <div class="modal-tributo-card">
                <h4>Tasa por Servicios Urbanos</h4>
                <p>Contribución por servicios municipales generales.</p>
                <ul>
                    <li>Facturación bimestral</li>
                    <li>Según zona y categoria del inmueble</li>
                    <li>Incluye: Alumbrado, limpieza, seguridad</li>
                    <li>Descuentos para jubilados</li>
                </ul>
            </div>
        </div>
        <hr class="modal-section-divider">
        <h3 class="modal-section-title">Tributos Adicionales Específicos</h3>
    `;

    const additionalContent = getTributosMunicipalesAdicionales(municipio);
    return baseContent + additionalContent;
}

function getTributosMunicipalesAdicionales(municipio) {
    const adicionales = tributosMunicipalesAdicionales[municipio] || [];
    
    if (adicionales.length === 0) {
        return `
            <div style="text-align: center; padding: 1rem;">
                <p>No hay tributos adicionales específicos registrados para este municipio.</p>
            </div>
        `;
    }

    return `
        <div class="modal-tributos-grid">
            ${adicionales.map(tributo => `
                <div class="modal-tributo-card">
                    <h4>${tributo.nombre}</h4>
                    <p>${tributo.descripcion}</p>
                    <ul>
                        <li>Tasa: ${tributo.tasa}</li>
                    </ul>
                </div>
            `).join('')}
        </div>
    `;
}

// Update mostrarMunicipio function to show Ver Más button
function mostrarMunicipio() {
    const municipio = document.getElementById('municipioSelect').value;
    const infoDiv = document.getElementById('municipio-info');
    const verMasContainer = document.getElementById('ver-mas-municipales');
    
    const municipiosInfo = {
        'capital': {
            nombre: 'San Miguel de Tucumán (Capital)',
            tributos: [
                'Tasa de Inspección de Seguridad e Higiene: 2.5‰ sobre ingresos brutos',
                'Derecho de Registro e Inspección: Según actividad',
                'Tasa por Servicios Urbanos: Variable según zona',
                'Contribución por Mejoras: Según obras públicas'
            ],
            contacto: 'Tel: (0381) 427-5000 - municipalidadcapital@tucuman.gov.ar'
        },
        'yerba-buena': {
            nombre: 'Yerba Buena',
            tributos: [
                'Tasa de Inspección de Seguridad e Higiene: 2‰ sobre ingresos brutos',
                'Derecho de Registro e Inspección: $5.000 - $15.000',
                'Tasa por Servicios Urbanos: $2.000 - $8.000 bimestral',
                'Tasa de Habilitación Comercial: Según superficie'
            ],
            contacto: 'Tel: (0381) 425-8800 - info@yerbabuena.gov.ar'
        },
        'tafi-viejo': {
            nombre: 'Tafí Viejo',
            tributos: [
                'Tasa de Inspección de Seguridad e Higiene: 2.5‰ sobre ingresos brutos',
                'Derecho de Registro e Inspección: $3.000 - $12.000',
                'Tasa por Servicios Urbanos: $1.500 - $6.000 bimestral',
                'Patente de Rodados: 0.5% del valor fiscal'
            ],
            contacto: 'Tel: (0381) 423-6000 - municipio@tafiviejo.gov.ar'
        },
        'banda-rio-sali': {
            nombre: 'Banda del Río Salí',
            tributos: [
                'Tasa de Inspección de Seguridad e Higiene: 2‰ sobre ingresos brutos',
                'Derecho de Registro e Inspección: $4.000 - $10.000',
                'Tasa por Servicios Urbanos: $1.800 - $5.500 bimestral',
                'Contribución Inmobiliaria: 0.8% del valor fiscal'
            ],
            contacto: 'Tel: (0381) 427-3200 - info@bandariosali.gov.ar'
        },
        'concepcion': {
            nombre: 'Concepción',
            tributos: [
                'Tasa de Inspección de Seguridad e Higiene: 2.2‰ sobre ingresos brutos',
                'Derecho de Registro e Inspección: $2.500 - $8.000',
                'Tasa por Servicios Urbanos: $1.200 - $4.000 bimestral',
                'Tasa de Alumbrado Público: $800 - $2.500 bimestral'
            ],
            contacto: 'Tel: (03865) 42-1000 - municipio@concepcion.gov.ar'
        },
        'lules': {
            nombre: 'Lules',
            tributos: [
                'Tasa de Inspección de Seguridad e Higiene: 2.3‰ sobre ingresos brutos',
                'Derecho de Registro e Inspección: $2.000 - $7.000',
                'Tasa por Servicios Urbanos: $1.000 - $3.500 bimestral',
                'Patente Única de Rodados: 0.4% del valor fiscal'
            ],
            contacto: 'Tel: (0381) 427-8500 - info@lules.gov.ar'
        }
    };

    if (municipio && municipiosInfo[municipio]) {
        const info = municipiosInfo[municipio];
        infoDiv.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.08);">
                <h3 style="color: #1e3c72; margin-bottom: 1.5rem; font-weight: 600;">${info.nombre}</h3>
                <div style="margin-bottom: 2rem;">
                    <h4 style="color: #28a745; margin-bottom: 1rem;">Principales Tributos Municipales:</h4>
                    <ul style="list-style: none; padding: 0;">
                        ${info.tributos.map(tributo => `
                            <li style="padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0; position: relative; padding-left: 1.5rem;">
                                <span style="position: absolute; left: 0; color: #28a745; font-weight: bold;">•</span>
                                ${tributo}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 5px; border-left: 4px solid #28a745;">
                    <h5 style="color: #1e3c72; margin-bottom: 0.5rem;">Información de Contacto:</h5>
                    <p style="margin: 0; color: #666;">${info.contacto}</p>
                </div>
            </div>
        `;
    } else {
        infoDiv.innerHTML = '<p>Seleccione un municipio para ver la información tributaria específica</p>';
    }
    
    // Show or hide Ver Más button
    if (municipio) {
        verMasContainer.style.display = 'block';
    } else {
        verMasContainer.style.display = 'none';
    }
}

// Close modal when pressing Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Initialize rotating banner
    initializeRotatingBanner();
    
    // Add smooth scrolling to all navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });
});

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(amount);
}

// Municipal additional taxes information
const tributosMunicipalesAdicionales = {
    'capital': [
        {
            nombre: 'Tasa de Cementerio',
            descripcion: 'Mantenimiento de cementerios municipales',
            tasa: '$2.000 - $8.000 anual'
        },
        {
            nombre: 'Contribución por Mejoras',
            descripcion: 'Obras de infraestructura urbana',
            tasa: 'Según valuación de obra'
        },
        {
            nombre: 'Tasa de Ocupación del Espacio Público',
            descripcion: 'Uso comercial de espacios públicos',
            tasa: '$500 - $3.000 mensual'
        },
        {
            nombre: 'Derecho de Oficina',
            descripcion: 'Trámites administrativos municipales',
            tasa: '$200 - $1.500 por trámite'
        }
    ],
    'yerba-buena': [
        {
            nombre: 'Tasa de Alumbrado Público',
            descripcion: 'Mantenimiento del sistema de alumbrado',
            tasa: '$800 - $2.500 bimestral'
        },
        {
            nombre: 'Contribución Especial de Obras',
            descripcion: 'Financiamiento de obras públicas específicas',
            tasa: 'Variable según obra'
        },
        {
            nombre: 'Tasa de Inspección Veterinaria',
            descripcion: 'Control sanitario de establecimientos',
            tasa: '$1.000 - $3.000 anual'
        }
    ],
    'tafi-viejo': [
        {
            nombre: 'Tasa de Limpieza',
            descripcion: 'Servicio de recolección de residuos',
            tasa: '$600 - $2.000 bimestral'
        },
        {
            nombre: 'Contribución por Pavimentación',
            descripcion: 'Obras de pavimentación urbana',
            tasa: 'Según frente del inmueble'
        },
        {
            nombre: 'Tasa de Espectáculos Públicos',
            descripcion: 'Habilitación para eventos y espectáculos',
            tasa: '$2.000 - $10.000 por evento'
        }
    ],
    'banda-rio-sali': [
        {
            nombre: 'Tasa de Construcción',
            descripcion: 'Inspección y control de obras',
            tasa: '1% - 2% del presupuesto'
        },
        {
            nombre: 'Contribución de Alumbrado',
            descripcion: 'Mantenimiento de luminarias',
            tasa: '$500 - $1.800 bimestral'
        },
        {
            nombre: 'Tasa de Habilitación de Locales',
            descripcion: 'Habilitación comercial e industrial',
            tasa: '$3.000 - $15.000'
        }
    ],
    'concepcion': [
        {
            nombre: 'Tasa de Barrido y Limpieza',
            descripcion: 'Mantenimiento de espacios públicos',
            tasa: '$400 - $1.500 bimestral'
        },
        {
            nombre: 'Contribución Especial Turística',
            descripcion: 'Promoción del turismo local',
            tasa: '2% sobre servicios turísticos'
        },
        {
            nombre: 'Tasa de Control Ambiental',
            descripcion: 'Monitoreo de impacto ambiental',
            tasa: '$800 - $3.000 anual'
        }
    ],
    'lules': [
        {
            nombre: 'Tasa de Agua Corriente',
            descripcion: 'Servicio de agua potable municipal',
            tasa: '$300 - $1.200 bimestral'
        },
        {
            nombre: 'Contribución Rural',
            descripcion: 'Mantenimiento de caminos rurales',
            tasa: '0.5% sobre valuación rural'
        },
        {
            nombre: 'Tasa de Ferias y Mercados',
            descripcion: 'Uso de espacios comerciales municipales',
            tasa: '$200 - $800 mensual'
        }
    ]
};

// Detailed tax information database
const detailedTaxInfo = {
    'ganancias': {
        nombre: 'Impuesto a las Ganancias',
        fechaSancion: '1973-12-27',
        ley: 'Ley N° 20.628',
        historia: [
            { fecha: '1973-12-27', evento: 'Sanción de la Ley N° 20.628 - Creación del Impuesto a las Ganancias' },
            { fecha: '1976-03-24', evento: 'Reforma mediante Ley N° 21.281 - Modificaciones en escalas y deducciones' },
            { fecha: '1998-12-30', evento: 'Ley N° 25.063 - Modificación de alícuotas para sociedades' },
            { fecha: '2013-12-04', evento: 'Ley N° 26.893 - Actualización del mínimo no imponible' },
            { fecha: '2017-12-29', evento: 'Ley N° 27.430 - Reforma Tributaria - Reducción gradual de alícuotas' },
            { fecha: '2021-12-23', evento: 'Ley N° 27.630 - Aumento de alícuotas para sociedades' },
            { fecha: '2024-12-30', evento: 'Actualización de escalas y mínimos no imponibles para 2025' }
        ],
        detallesActuales: {
            alicuotaSociedades: '35%',
            minimoNoImponible: '$2.800.000',
            escalasPersonasFisicas: '5% a 35%',
            vencimientos: 'Abril a Julio (según terminación CUIT)'
        },
        informacionAdicional: [
            'Es un tributo directo que grava las ganancias obtenidas por personas físicas y jurídicas',
            'Se aplica tanto a residentes como no residentes argentinos',
            'Las ganancias pueden ser de fuente argentina o del exterior',
            'Existen deducciones específicas según el tipo de contribuyente',
            'Se liquida anualmente con anticipos durante el ejercicio fiscal'
        ]
    },
    'iva': {
        nombre: 'Impuesto al Valor Agregado (IVA)',
        fechaSancion: '1975-03-18',
        ley: 'Ley N° 20.631',
        historia: [
            { fecha: '1975-03-18', evento: 'Sanción de la Ley N° 20.631 - Creación del IVA' },
            { fecha: '1990-12-28', evento: 'Ley N° 23.765 - Aumento de alícuota general al 15%' },
            { fecha: '1991-02-01', evento: 'Implementación de alícuota del 18%' },
            { fecha: '1995-04-01', evento: 'Aumento a alícuota general del 21%' },
            { fecha: '2001-04-01', evento: 'Creación de alícuota reducida del 10.5%' },
            { fecha: '2009-01-01', evento: 'Régimen de Percepción para tarjetas de crédito' },
            { fecha: '2020-12-23', evento: 'Ley N° 27.630 - Modificaciones en el régimen de percepciones' }
        ],
        detallesActuales: {
            alicuotaGeneral: '21%',
            alicuotaReducida: '10.5%',
            alicuotaCero: '0% (exportaciones)',
            vencimientos: 'Mensual según terminación CUIT'
        },
        informacionAdicional: [
            'Tributo al consumo que grava el valor agregado en cada etapa de comercialización',
            'Sistema de débito fiscal (ventas) menos crédito fiscal (compras)',
            'La alícuota del 21% es una de las más altas de América Latina',
            'Existen regímenes especiales para determinados sectores',
            'Se aplica también a importaciones de bienes y servicios'
        ]
    },
    'bienes-personales': {
        nombre: 'Impuesto a los Bienes Personales',
        fechaSancion: '1991-12-30',
        ley: 'Ley N° 23.966',
        historia: [
            { fecha: '1991-12-30', evento: 'Sanción de la Ley N° 23.966 - Creación del Impuesto a los Bienes Personales' },
            { fecha: '2001-12-20', evento: 'Suspensión temporal del impuesto' },
            { fecha: '2007-11-20', evento: 'Reestablecimiento del impuesto mediante Ley N° 26.317' },
            { fecha: '2016-07-15', evento: 'Ley N° 27.260 - Blanqueo de capitales y modificaciones' },
            { fecha: '2018-12-28', evento: 'Ley N° 27.480 - Nuevas escalas y alícuotas' },
            { fecha: '2023-12-29', evento: 'Actualización del mínimo no imponible a $27.000.000' }
        ],
        detallesActuales: {
            minimoNoImponible: '$27.000.000',
            alicuotaMinima: '0.5%',
            alicuotaMaxima: '1.25%',
            vencimiento: '31 de diciembre'
        },
        informacionAdicional: [
            'Grava el patrimonio neto de personas físicas y sucesiones indivisas',
            'Se consideran tanto bienes situados en el país como en el exterior',
            'Existen deducciones por casa habitación y otros conceptos',
            'Los no residentes tributan solo por bienes en Argentina',
            'Se permite el pago en hasta 5 cuotas'
        ]
    },
    'ingresos-brutos': {
        nombre: 'Impuesto sobre los Ingresos Brutos',
        fechaSancion: '1948-03-15',
        ley: 'Decreto-Ley N° 7.904/48 (Tucumán)',
        historia: [
            { fecha: '1948-03-15', evento: 'Creación en Tucumán - Decreto-Ley N° 7.904/48' },
            { fecha: '1973-08-21', evento: 'Reformulación mediante Ley Provincial N° 4.685' },
            { fecha: '1990-12-28', evento: 'Nueva estructura del impuesto - Ley N° 6.132' },
            { fecha: '2003-12-11', evento: 'Convenio Multilateral - Unificación de criterios entre provincias' },
            { fecha: '2018-04-01', evento: 'Reforma del Convenio Multilateral' },
            { fecha: '2023-01-01', evento: 'Actualización de alícuotas y actividades gravadas' }
        ],
        detallesActuales: {
            alicuotaComercio: '3.5% - 5.5%',
            alicuotaIndustria: '1.2% - 3.2%',
            alicuotaServicios: '4% - 8%',
            vencimientos: 'Mensual según actividad'
        },
        informacionAdicional: [
            'Principal tributo recaudatorio de las provincias argentinas',
            'Grava el ejercicio habitual de actividades económicas',
            'Cada provincia tiene su propio régimen con particularidades',
            'El Convenio Multilateral evita la doble imposición interprovincial',
            'Existen regímenes especiales para PYMES y actividades específicas'
        ]
    },
    'inmobiliario': {
        nombre: 'Impuesto Inmobiliario',
        fechaSancion: '1916-09-15',
        ley: 'Ley Provincial N° 458 (Tucumán)',
        historia: [
            { fecha: '1916-09-15', evento: 'Primera ley del impuesto inmobiliario en Tucumán' },
            { fecha: '1962-07-10', evento: 'Ley N° 3.385 - Modernización del sistema de valuación' },
            { fecha: '1993-12-22', evento: 'Ley N° 6.624 - Actualización de alícuotas y procedimientos' },
            { fecha: '2008-11-27', evento: 'Ley N° 7.963 - Nuevas escalas y beneficios' },
            { fecha: '2020-12-30', evento: 'Actualización de valuaciones fiscales' },
            { fecha: '2024-01-01', evento: 'Nuevas alícuotas vigentes desde 2024' }
        ],
        detallesActuales: {
            inmuebleUrbano: '0.6% - 1.8%',
            inmuebleRural: '0.4% - 1.2%',
            baldiosRecargo: '50% adicional',
            vencimientos: 'Anual con descuentos por pago anticipado'
        },
        informacionAdicional: [
            'Tributo anual que grava la propiedad inmobiliaria',
            'Base imponible: valuación fiscal del inmueble',
            'Existen descuentos por pago anual anticipado (hasta 20%)',
            'Hay exenciones para jubilados con determinados requisitos',
            'Los baldíos urbanos tienen un recargo del 50%'
        ]
    },
    'automotor': {
        nombre: 'Impuesto a los Automotores',
        fechaSancion: '1971-08-12',
        ley: 'Ley Provincial N° 4.456 (Tucumán)',
        historia: [
            { fecha: '1971-08-12', evento: 'Sanción de la Ley N° 4.456 - Creación del impuesto' },
            { fecha: '1991-12-19', evento: 'Ley N° 6.304 - Modificación de alícuotas y exenciones' },
            { fecha: '2002-04-25', evento: 'Ley N° 7.180 - Actualización del régimen' },
            { fecha: '2015-12-17', evento: 'Ley N° 8.785 - Nuevas categorías vehiculares' },
            { fecha: '2021-01-01', evento: 'Implementación de valuación automática por año modelo' },
            { fecha: '2024-03-01', evento: 'Actualización de valores y alícuotas para 2024' }
        ],
        detallesActuales: {
            rango: '1.8% - 3.2%',
            baseLegal: 'Valor fiscal según año y modelo',
            exenciones: 'Vehículos de más de 20 años',
            vencimientos: 'Anual con opción de pago en cuotas'
        },
        informacionAdicional: [
            'Tributo anual sobre la propiedad de vehículos automotores',
            'La alícuota varía según el año de fabricación y tipo de vehículo',
            'Existe bonificación por pago anticipado (10%)',
            'Los vehículos históricos (más de 30 años) pueden estar exentos',
            'Se puede abonar en hasta 10 cuotas mensuales'
        ]
    }
};

// Open detailed tax modal
function openTributoModal(taxId) {
    const taxInfo = detailedTaxInfo[taxId];
    if (!taxInfo) return;
    
    const modal = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    
    modalTitle.textContent = `${taxInfo.nombre} - Información Detallada`;
    modalContent.innerHTML = generateDetailedTaxContent(taxInfo);
    modalContent.classList.add('detailed-modal-content');
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function generateDetailedTaxContent(taxInfo) {
    return `
        <div class="tax-details-grid">
            <div class="detail-card">
                <h5>📜 Información Legal</h5>
                <p><strong>Fecha de Sanción:</strong> ${formatDate(taxInfo.fechaSancion)}</p>
                <p><strong>Ley de Origen:</strong> ${taxInfo.ley}</p>
                <p><strong>Última Actualización:</strong> ${formatDate(taxInfo.historia[taxInfo.historia.length - 1].fecha)}</p>
            </div>
            
            <div class="detail-card">
                <h5>📊 Datos Actuales</h5>
                <div class="current-rates">
                    ${Object.entries(taxInfo.detallesActuales).map(([key, value]) => `
                        <p><strong>${formatFieldName(key)}:</strong> <span class="rate-highlight">${value}</span></p>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="tax-history-section">
            <h4>📅 Historia y Modificaciones</h4>
            <div class="history-timeline">
                ${taxInfo.historia.map(item => `
                    <div class="timeline-item">
                        <div class="timeline-date">${formatDate(item.fecha)}</div>
                        <div class="timeline-event">${item.evento}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="tax-history-section">
            <h4>💡 Información Adicional</h4>
            <ul style="list-style: none; padding: 0;">
                ${taxInfo.informacionAdicional.map(info => `
                    <li style="padding: 0.5rem 0; border-bottom: 1px solid #e9ecef; position: relative; padding-left: 1.5rem;">
                        <span style="position: absolute; left: 0; color: #28a745; font-weight: bold;">•</span>
                        ${info}
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatFieldName(fieldName) {
    const fieldNames = {
        'alicuotaSociedades': 'Alícuota Sociedades',
        'minimoNoImponible': 'Mínimo No Imponible',
        'escalasPersonasFisicas': 'Escalas Personas Físicas',
        'vencimientos': 'Vencimientos',
        'alicuotaGeneral': 'Alícuota General',
        'alicuotaReducida': 'Alícuota Reducida',
        'alicuotaCero': 'Alícuota 0%',
        'alicuotaMinima': 'Alícuota Mínima',
        'alicuotaMaxima': 'Alícuota Máxima',
        'vencimiento': 'Vencimiento',
        'alicuotaComercio': 'Comercio',
        'alicuotaIndustria': 'Industria',
        'alicuotaServicios': 'Servicios',
        'inmuebleUrbano': 'Inmueble Urbano',
        'inmuebleRural': 'Inmueble Rural',
        'baldiosRecargo': 'Baldíos (Recargo)',
        'rango': 'Rango de Alícuotas',
        'baseLegal': 'Base Legal',
        'exenciones': 'Exenciones'
    };
    return fieldNames[fieldName] || fieldName;
}

let categorias = null
let productos = null
let productosCarrito = localStorage.getItem('productosCarrito') ? JSON.parse(localStorage.getItem('productosCarrito')) : [];

//Cuando termina de cargar la pagina productos.html cargo los datos desde data.json
document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname.endsWith("productos.html")) {
        cargarProductos();
    }
});
document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname.endsWith("contacto.html")) {
        agregarEventoBtnContacto();
    }
});

// Carga la lista de productos desde data.json
function cargarProductos() {
    fetch('../jsonData/data.json')
        .then(response => response.json())
        .then(data => {
            categorias = data.categorias
            productos = data.productos
            cargarListadoProductos()
        })
        .catch(error => console.error('Error al cargar el archivo JSON', error))
}

// Genero las cards para los productos que tengo en la variable productos
function generarTablaProductos(productos) {
    let tablaHTML = "";
    if (productos !== null) {
        for (const producto of productos) {
            tablaHTML += `
                <div class="row">
                    <div class="slideInFromRight col-lg-12">
                        <div class="card mb-4" style="height: 100%;">
                            <div class="row g-0">
                                <div class="imagenProducto col-md-4">
                                    <img src="../img/${producto.img}" class="card-img-top" alt="${producto.descripcionCorta}">
                                </div>
                                <div class="col-md-8">
                                    <div class="card-body d-flex flex-column justify-content-between" style="height: 100%;">
                                        <div>
                                            <h5 class="card-title">${getCategoria(producto.categoria) ? getCategoria(producto.categoria).desc : ""} - Aroma: ${producto.descripcionCorta}</h5>
                                            <p class="card-text">${producto.descripcionLarga}</p>
                                        </div>
                                        <a href="#" class="btn btn-secondary align-self-end agregar-carrito-btn"
                                            data-codigo="${producto.codigo}"
                                            data-descripcion="${producto.descripcionLarga}"
                                            data-precio="${producto.precio}"
                                        >
                                            Agregar al Carrito
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
        }
    } else {
        tablaHTML = "Error al cargar Productos";
    }

    return tablaHTML;
}

// Cargo los productos al HTML 
function cargarListadoProductos() {
    // Verifico si productos no es nulo antes de generar el HTML
    if (productos !== null) {
        const tablaProductosHTML = generarTablaProductos(productos)
        document.getElementById("tablaProductos").innerHTML = tablaProductosHTML
        // Agrego los eventos a los botones del listado de productos
        onClickAgregarCarritoBtn()
        // Agrego el evento para usar el carrito
        onClickCarrito()
    } else {
        console.error("No se han cargado Productos")
    }
}


function getCategoria(codigo) {
    const categoriaEncontrada = categorias.find(categoria => categoria.codigo === codigo);
    return categoriaEncontrada ? categoriaEncontrada : null
}

function onClickAgregarCarritoBtn() {
    // Capturo evento onclick de los botones "Agregar al Carrito"
    const agregarCarritoBtns = document.querySelectorAll(".agregar-carrito-btn")
    agregarCarritoBtns.forEach(btn => {
        btn.addEventListener("click", function (event) {
            event.preventDefault()
            const codigo = btn.getAttribute("data-codigo")
            //Guardo el producto y agrego productosCarrito al localStorage
            productosCarrito.push(productos.filter(prod => prod.codigo == codigo)[0])

            Swal.fire({
                position: 'top-end',
                icon: 'success',
                title: 'El producto fue agregado al Carrito',
                showConfirmButton: false,
                timer: 1500
            })
        });
    });
}

function onClickCarrito() {
    const carritoBtn = document.getElementById("carritoBtn");
    // Agrego evento Click al botón del carrito
    carritoBtn.addEventListener("click", function () {
        mostrarProductosCarrito(productosCarrito);
    });
}
// Despliego carrito de compras y actuo segun la interaccion del usuario
function mostrarProductosCarrito(productosCarrito) {
    inicializarCarritoModalBody()
    const carritoModalBody = document.getElementById("carritoModalBody")

    let html = ""
    let total = 0

    // si no tengo nada en productosCarrito 
    if (productosCarrito.length === 0) {
        carritoModalBody.innerHTML = "<p>Tu carrito está vacío.</p>"
    } else {
        // Tengo productos en el carrito voy armando el modal para mostrar
        for (let prod of productosCarrito) {
            html += `<p>${getCategoria(prod.categoria) ? getCategoria(prod.categoria).desc + " - " : ""} Aroma: ${prod.descripcionCorta} - Precio: $${prod.precio}</p>`
            total += prod.precio
        }

        html += `<p><strong>Total a pagar: ${total}</strong></p>`
        carritoModalBody.innerHTML = html

        // si tengo productos los agrego al localStorage
        localStorage.removeItem('productosCarrito') // Limpio localStorage
        productosCarrito.length !== 0 && localStorage.setItem('productosCarrito', productosCarrito) // agrego la lista de productos
    }

    // Mostrar el modal
    const carritoModal = new bootstrap.Modal(document.getElementById("carritoModal"))
    carritoModal.show()

    //Evento btn close modal, dejo guardado en el session lo agregado hasta el momento
    const closeModal = document.getElementById('btnCloseModal')
    closeModal.addEventListener('click', () => {
        carritoModal.hide()

        productosCarrito.length !== 0 && Swal.fire({
            position: 'top-end',
            icon: 'info',
            title: 'Tus productos quedaran esperando para cuando quieras finalizar tu compra',
            showConfirmButton: false,
            timer: 2500
        })
    })

    //Evento btn Cancelar Compra    
    const cancelarCompra = document.getElementById('cancelarCompra')
    cancelarCompra.addEventListener('click', () => {
        if (productosCarrito.length !== 0) {
            // quito los productos del carrito
            vaciarCarrito()
            inicializarCarritoModalBody()
            Swal.fire({
                position: 'top-end',
                icon: 'info',
                title: 'Los productos fueron retirados del carrito',
                showConfirmButton: false,
                timer: 1500
            })
        }
        carritoModal.hide()
    });

    //Evento btn Confirmar Compra
    const confirmarCompra = document.getElementById('confirmarCompra')
    confirmarCompra.addEventListener('click', () => {
        if (productosCarrito.length !== 0) {
            carritoModal.hide()
            finalizarCompra(productosCarrito)
        } else {
            Swal.fire({
                position: 'top-end',
                icon: 'warning',
                title: 'No tienes productos en tu carrito',
                showConfirmButton: true
            })
        }
    });
}

async function finalizarCompra(productosCarrito) {
    let numContacto;
    try {
        const result = await Swal.fire({
            title: 'Muchas gracias por su compra',
            input: 'text',
            inputLabel: 'Dejanos un numero de contacto y uno de nuestros vendedores te contactará para coordinar la entrega',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'Debes ingresar tu numero de contacto';
                }
            }
        });

        if (result.isConfirmed) {
            numContacto = result.value;
            agregarCompraRealizada(productosCarrito, numContacto);
        }
    } catch (error) {
        console.error('Error al finalizar la compra:', error);
    }
}



function agregarCompraRealizada(productosCarrito, numContacto) {
    // Me genero un objeto para luego guardarlo
    const nuevaCompra = {
        productos: productosCarrito,
        numeroContacto: numContacto,
        fecha: new Date().toISOString(),
    }

    localStorage.setItem("nuevaCompra", JSON.stringify(nuevaCompra));
    
    vaciarCarrito()
    inicializarCarritoModalBody()
}

function vaciarCarrito() {
    // Quito los elementos del carrito
    productosCarrito = []
    // Elimino el carrito de la localStorage
    localStorage.removeItem('productosCarrito')
}

function inicializarCarritoModalBody() {
    // inicializo el modalBody del carrito
    const carritoModalBody = document.getElementById("carritoModalBody")
    carritoModalBody.innerHTML = "<p>Tu carrito esta vacío</p>"
}

function agregarEventoBtnContacto() {
    const enviarBtn = document.getElementById("enviarBtn");
    
    enviarBtn.addEventListener("click", function (e) {
        e.preventDefault();

        const nombre = document.getElementById("formNmobre").value;
        const correo = document.getElementById("formEmail").value;
        const mensaje = document.getElementById("formTextArea").value;

        const contacto = {
            nombre,
            correo,
            mensaje,
        };

        Swal.fire({
            position: 'top-end',
            icon: 'info',
            title: 'Tu mensaje fue enviado, gracias por preferirnos',
            showConfirmButton: true
        })
        // Guardo el objeto JSON en localStorage
        localStorage.setItem("contacto", JSON.stringify(contacto));
    });
}
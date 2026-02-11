// carritoCompras.js - Manejo del carrito de compras
import { cargarProductos } from './cargueInventario.js';
import { mostrarMensaje } from './funcionesWeb.js';
import { productosGlobal, carrito, guardarCarrito, actualizarContadorGlobal } from './estadoGlobal.js';

// 1. Configuración de la API
const API_URL = '/api';

// 2. Función para mostrar los productos en el carrito
export async function mostrarCarrito() {
    const emptyCart = document.getElementById('emptyCart');
    const cartWithItems = document.getElementById('cartWithItems');

    // Solo ejecutar si estamos en la página del carrito
    if (!emptyCart || !cartWithItems) return;

    // Cargar productos si es necesario
    if (productosGlobal.length === 0) {
        await cargarProductos();
    }

    const carritoContainer = document.getElementById('carritoContainer');
    const subtotalElement = document.getElementById('subtotal');
    const totalContainer = document.getElementById('totalContainer');

    // Mostrar estado vacío o con productos
    if (carrito.length === 0) {
        emptyCart.style.display = 'block';
        cartWithItems.style.display = 'none';

        // ✅ ACTUALIZAR LOS TOTALES A 0 CUANDO EL CARRITO ESTÁ VACÍO
        if (subtotalElement) subtotalElement.textContent = '$0';
        if (totalContainer) totalContainer.textContent = '$0';

        actualizarContadorGlobal();
        return;
    }

    emptyCart.style.display = 'none';
    cartWithItems.style.display = 'block';

    // Generar HTML de los productos
    carritoContainer.innerHTML = '';
    let subtotal = 0;

    carrito.forEach(item => {
        const producto = productosGlobal.find(p => p.id === item.productoId);
        if (producto) {
            const itemTotal = producto.precio * item.cantidad;
            subtotal += itemTotal;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'product-card';
            itemDiv.innerHTML = `
                    <div class="product-image-container">
                        <img src="${producto.imagenUrl || './assets/img/default-product.jpg'}" 
                            alt="${producto.nombre}"
                            class="product-image" />
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${producto.nombre}</h3>
                        <p class="product-category">${producto.categoria}</p>
                        <div class="product-price">
                            <span class="current-price">$${producto.precio.toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="product-actions">
                        <button class="quantity-btn" data-id="${producto.id}" data-action="decrease">-</button>
                        <span class="quantity-number">${item.cantidad}</span>
                        <button class="quantity-btn" data-id="${producto.id}" data-action="increase">+</button>
                    </div>
                    <div class="product-info">
                        <span class="product-description">$${itemTotal.toLocaleString()}</span>
                    </div>
                    <button class="btn btn-primary btn-small remove-btn" data-id="${producto.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
            carritoContainer.appendChild(itemDiv);
        }
    });

    // Actualizar totales
    if (subtotalElement) subtotalElement.textContent = `$${subtotal.toLocaleString()}`;
    if (totalContainer) totalContainer.textContent = `$${subtotal.toLocaleString()}`;
    actualizarContadorGlobal();

    // Agregar event listeners
    agregarEventListenersCarrito();
}

// 3. Función para agregar event listeners a los botones del carrito
function agregarEventListenersCarrito() {
    console.log('Agregando event listeners al carrito...');

    // Botones de eliminar
    document.querySelectorAll('.remove-btn').forEach(btn => {
        console.log('Botón eliminar encontrado:', btn);
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const productoId = e.currentTarget.getAttribute('data-id'); // ELIMINAR parseInt
            console.log('Eliminando producto con ID:', productoId);
            eliminarDelCarrito(productoId);
        });
    });

    // Botones de cantidad (aumentar/disminuir)
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        console.log('Botón cantidad encontrado:', btn);
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const productoId = e.currentTarget.getAttribute('data-id'); // ELIMINAR parseInt
            const action = e.currentTarget.getAttribute('data-action');
            console.log('Botón clickeado - ID:', productoId, 'Action:', action);
            actualizarCantidad(productoId, action);
        });
    });

    // Botón de checkout
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        // Remover listener anterior para evitar duplicados
        const newCheckoutBtn = checkoutBtn.cloneNode(true);
        checkoutBtn.parentNode.replaceChild(newCheckoutBtn, checkoutBtn);
        newCheckoutBtn.addEventListener('click', procederAlPago);
    }
}

// 4. Función para eliminar producto del carrito
function eliminarDelCarrito(productoId) {
    console.log('Carrito antes de eliminar:', carrito);
    console.log('Intentando eliminar producto ID:', productoId);

    // Filtrar el carrito para excluir el producto
    const nuevoCarrito = carrito.filter(item => {
        console.log('Comparando:', item.productoId, '!==', productoId);
        return item.productoId !== productoId;
    });

    console.log('Carrito después de filtrar:', nuevoCarrito);

    // Guardar el nuevo carrito
    guardarCarrito(nuevoCarrito);

    // Mostrar mensaje
    mostrarMensaje('Producto eliminado del carrito');

    // Actualizar la vista
    mostrarCarrito();
}

// 5. Función para actualizar cantidad
function actualizarCantidad(productoId, action) {
    console.log('Actualizando cantidad:', productoId, action);

    // Crear una copia del carrito
    const nuevoCarrito = [...carrito];
    const itemIndex = nuevoCarrito.findIndex(item => item.productoId === productoId);

    if (itemIndex !== -1) {
        if (action === 'increase') {
            nuevoCarrito[itemIndex].cantidad += 1;
            mostrarMensaje('Cantidad actualizada');
        } else if (action === 'decrease') {
            if (nuevoCarrito[itemIndex].cantidad > 1) {
                nuevoCarrito[itemIndex].cantidad -= 1;
                mostrarMensaje('Cantidad actualizada');
            } else {
                // Si la cantidad es 1 y se quiere disminuir, eliminar el producto
                nuevoCarrito.splice(itemIndex, 1);
                mostrarMensaje('Producto eliminado del carrito');
            }
        }

        // Guardar y actualizar
        guardarCarrito(nuevoCarrito);
        mostrarCarrito();
    }
}

// 6. Función para proceder al pago (WhatsApp)
function procederAlPago() {
    if (carrito.length === 0) {
        mostrarMensaje('El carrito está vacío', 'error');
        return;
    }

    // Crear mensaje para WhatsApp
    let mensaje = "¡Hola! Estoy interesado en los siguientes productos:\n\n";
    let total = 0;

    carrito.forEach(item => {
        const producto = productosGlobal.find(p => p.id === item.productoId);
        if (producto) {
            const subtotal = producto.precio * item.cantidad;
            total += subtotal;
            mensaje += `• ${producto.nombre}\n`;
            mensaje += `  Cantidad: ${item.cantidad}\n`;
            mensaje += `  Subtotal: $${subtotal.toLocaleString()}\n\n`;
        }
    });

    mensaje += `📦 TOTAL: $${total.toLocaleString()}\n\n`;
    mensaje += `Por favor, confirma la disponibilidad y coordinemos el pago.`;

    // Abrir WhatsApp
    const numeroWhatsApp = '573043401416';
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsApp, '_blank');

    mostrarMensaje('Redirigiendo a WhatsApp...');
}

// 7. Función para agregar productos al carrito
export function agregarAlCarrito(productoId, cantidad = 1) {
    console.log('Recibiendo en agregarAlCarrito - ID:', productoId, 'Tipo:', typeof productoId, 'cantidad:', cantidad);

    // Crear una copia del carrito actual
    const nuevoCarrito = [...carrito];

    // Buscar si el producto ya existe en el carrito
    const itemIndex = nuevoCarrito.findIndex(item => item.productoId === productoId);

    if (itemIndex !== -1) {
        // Si existe, aumentar la cantidad
        nuevoCarrito[itemIndex].cantidad += cantidad;
        mostrarMensaje('Producto actualizado en el carrito');
    } else {
        // Si no existe, agregarlo
        nuevoCarrito.push({
            productoId: productoId,
            cantidad: cantidad
        });
        mostrarMensaje('Producto agregado al carrito');
    }

    // Guardar el carrito actualizado
    guardarCarrito(nuevoCarrito);

    // Si estamos en la página del carrito, actualizar la vista
    const carritoContainer = document.getElementById('carritoContainer');
    if (carritoContainer) {
        mostrarCarrito();
    }
}

// 8. Función de inicialización del carrito
function inicializarCarrito() {
    // Verificar si estamos en la página del carrito
    const emptyCart = document.getElementById('emptyCart');
    if (emptyCart) {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', async () => {
                try {
                    console.log('Inicializando página del carrito...');
                    if (productosGlobal.length === 0) {
                        await cargarProductos();
                    }
                    mostrarCarrito();
                } catch (error) {
                    console.error('Error en inicialización:', error);
                    mostrarMensaje('Error al cargar el carrito', 'error');
                }
            });
        } else {
            // Si el DOM ya está listo
            (async () => {
                try {
                    console.log('DOM ya cargado, inicializando carrito...');
                    if (productosGlobal.length === 0) {
                        await cargarProductos();
                    }
                    mostrarCarrito();
                } catch (error) {
                    console.error('Error en inicialización:', error);
                    mostrarMensaje('Error al cargar el carrito', 'error');
                }
            })();
        }
    }
}

// 9. Inicializar siempre el contador global
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        actualizarContadorGlobal();
    });
} else {
    actualizarContadorGlobal();
}

// Inicializar carrito
inicializarCarrito();

// Exportar funciones para uso en otros módulos
export { guardarCarrito };
import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import Navbar from "../components/Navbar";
import "../styles/cart.css";

function Cart() {
  const { cart, increaseQty, decreaseQty } = useContext(CartContext);

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <>
      <Navbar />

      <div className="cart-container">
        <h2>Your Cart</h2>

        {cart.length === 0 ? (
          <p>Cart is empty 🛒</p>
        ) : (
          <>
            {cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={item.image} alt="product" />

                <div>
                  <h3>{item.name}</h3>
                  <p>₹{item.price}</p>
                </div>

                <div className="qty-controls">
                  <button onClick={() => decreaseQty(item.id)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => increaseQty(item.id)}>+</button>
                </div>
              </div>
            ))}

            <h3>Total: ₹{totalPrice}</h3>
          </>
        )}
      </div>
    </>
  );
}

export default Cart;
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {

    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }    
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productApi = await api.get(`/products/${productId}`).then((product => {return product.data as Product}))
      const stockApi = await api.get(`/stock/${productId}`).then((stock => {return stock.data as Stock}))
      
      let hasValue = false;

      let newCart = cart.map(product => {
        if(product.id === productId){
          if(product.amount > 0){
            if(product.amount >= stockApi.amount){
              hasValue = true  
              const newLocal = 'Quantidade solicitada fora de estoque';
              throw newLocal; 
            }
            else{            
              product.amount += 1 
              hasValue = true
            }            
          }
        }
        return product
      })

      if(hasValue === false){
        productApi.amount = 1
        newCart.push(productApi) 
      }
      setCart(newCart as Product[])
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))     

    } catch(error: string | any) {
      toast.error(error.length > 0 ? error : 'Erro na adição do produto'); 
    }    
  };

  const removeProduct = (productId: number) => {
    try {
      if(cart === []){
        const error = 'Erro na remoção do produto';
        throw error;
      }
      const product = cart.filter((product: Product) => product.id === productId)
      if(product === null || product.length === 0 || product === undefined) {
        const error1 = 'Erro na remoção do produto';
        throw error1
      }      

      const newCart = cart.filter((productN: Product) => productN.id !== productId)

      setCart(newCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
     
    } catch(error: string | any){
      toast.error(error.length > 0 ? error : 'Erro na remoção do produto'); 
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0){
        return
      }            
      const stockApi = await api.get(`/stock/${productId}`).then((stock => {return stock.data as Stock}))
      
      const newCart = cart.map((product) => {
        if(amount > stockApi.amount){
          const error = 'Quantidade solicitada fora de estoque';
          throw error;
        }
        product.amount = amount  

        return product
      })
      setCart(newCart)      
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart)) 

    } catch(error: any | string) {
        toast.error(error.length > 0 ? error : 'Erro na alteração de quantidade do produto'); 
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

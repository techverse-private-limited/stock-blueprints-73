
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BillItem {
  id?: string;
  food_item_id: string;
  food_item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Bill {
  id?: string;
  bill_number: string;
  customer_name: string;
  customer_phone?: string;
  created_by?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  items: BillItem[];
}

export const useBills = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateBillNumber = () => {
    return `BILL-${Date.now().toString().slice(-6)}`;
  };

  const saveBill = async (billData: Bill) => {
    setLoading(true);
    try {
      const billNumber = billData.bill_number || generateBillNumber();
      
      // Insert the bill
      const { data: billResult, error: billError } = await supabase
        .from('bills')
        .insert({
          bill_number: billNumber,
          customer_name: billData.customer_name,
          customer_phone: billData.customer_phone || null,
          created_by: billData.created_by || null,
          subtotal: billData.subtotal,
          tax_amount: billData.tax_amount,
          total_amount: billData.total_amount,
        })
        .select()
        .single();

      if (billError) throw billError;

      // Insert bill items
      const billItemsData = billData.items.map(item => ({
        bill_id: billResult.id,
        food_item_id: item.food_item_id,
        food_item_name: item.food_item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(billItemsData);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: `Bill ${billNumber} generated successfully!`,
      });

      return billResult;
    } catch (error) {
      console.error('Error saving bill:', error);
      toast({
        title: "Error",
        description: "Failed to generate bill",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    saveBill,
    generateBillNumber,
    loading
  };
};

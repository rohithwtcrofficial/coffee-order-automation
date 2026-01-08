// src/lib/utils/customerUtils.ts
import { adminDb } from '@/lib/firebase/admin';
import { Customer, Address } from '@/lib/types/order';
import { FieldValue } from 'firebase-admin/firestore';

interface CustomerInput {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    label?: string;
  };
}

interface FindOrCreateCustomerResult {
  customerId: string;
  addressId: string;
  isNewCustomer: boolean;
  isNewAddress: boolean;
}

/**
 * Finds existing customer by email or phone, or creates a new one
 * If customer exists, checks if address exists and adds it if new
 */
export async function findOrCreateCustomer(
  input: CustomerInput
): Promise<FindOrCreateCustomerResult> {
  const { name, email, phone, address } = input;

  try {
    // Search for existing customer by email or phone
    const customerQuery = await adminDb
      .collection('customers')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    // If customer exists
    if (!customerQuery.empty) {
      const customerDoc = customerQuery.docs[0];
      const customerData = customerDoc.data() as Customer;
      const customerId = customerDoc.id;

      // Check if this exact address already exists
      const existingAddress = customerData.addresses?.find(
        (addr) =>
          addr.street.toLowerCase() === address.street.toLowerCase() &&
          addr.city.toLowerCase() === address.city.toLowerCase() &&
          addr.postalCode === address.postalCode
      );

      if (existingAddress) {
        // Address already exists, use it
        return {
          customerId,
          addressId: existingAddress.id,
          isNewCustomer: false,
          isNewAddress: false,
        };
      } else {
        // Add new address to existing customer
        const newAddressId = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newAddress: Address = {
          id: newAddressId,
          ...address,
          isDefault: customerData.addresses?.length === 0, // First address is default
          createdAt: new Date().toISOString(),
        };

        await adminDb
          .collection('customers')
          .doc(customerId)
          .update({
            addresses: FieldValue.arrayUnion(newAddress),
            updatedAt: FieldValue.serverTimestamp(),
            // Update name and phone in case they changed
            name,
            phone,
          });

        return {
          customerId,
          addressId: newAddressId,
          isNewCustomer: false,
          isNewAddress: true,
        };
      }
    } else {
      // Create new customer
      const addressId = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newAddress: Address = {
        id: addressId,
        ...address,
        isDefault: true, // First address is always default
        createdAt: new Date().toISOString(),
      };

      const newCustomer = {
        name,
        email: email.toLowerCase(),
        phone,
        addresses: [newAddress],
        totalOrders: 0,
        totalSpent: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const customerRef = await adminDb.collection('customers').add(newCustomer);

      return {
        customerId: customerRef.id,
        addressId: addressId,
        isNewCustomer: true,
        isNewAddress: true,
      };
    }
  } catch (error) {
    console.error('Error in findOrCreateCustomer:', error);
    throw new Error('Failed to find or create customer');
  }
}

/**
 * Updates customer stats after order is RECEIVED
 */
export async function updateCustomerStats(
  customerId: string,
  orderAmount: number
): Promise<void> {
  try {
    await adminDb
      .collection('customers')
      .doc(customerId)
      .update({
        totalOrders: FieldValue.increment(1),
        totalSpent: FieldValue.increment(orderAmount),
        updatedAt: FieldValue.serverTimestamp(),
      });
  } catch (error) {
    console.error('Error updating customer stats:', error);
    throw new Error('Failed to update customer statistics');
  }
}

/**
 * Get customer with all addresses
 */
export async function getCustomerWithAddresses(customerId: string): Promise<Customer | null> {
  try {
    const customerDoc = await adminDb.collection('customers').doc(customerId).get();
    
    if (!customerDoc.exists) {
      return null;
    }

    const data = customerDoc.data();
    return {
      id: customerDoc.id,
      ...data,
      createdAt: data?.createdAt?.toDate().toISOString() || new Date().toISOString(),
      updatedAt: data?.updatedAt?.toDate().toISOString() || new Date().toISOString(),
    } as Customer;
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

/**
 * Set an address as default for a customer
 */
export async function setDefaultAddress(
  customerId: string,
  addressId: string
): Promise<void> {
  try {
    const customerDoc = await adminDb.collection('customers').doc(customerId).get();
    
    if (!customerDoc.exists) {
      throw new Error('Customer not found');
    }

    const customerData = customerDoc.data() as Customer;
    const updatedAddresses = customerData.addresses?.map((addr) => ({
      ...addr,
      isDefault: addr.id === addressId,
    }));

    await adminDb
      .collection('customers')
      .doc(customerId)
      .update({
        addresses: updatedAddresses,
        updatedAt: FieldValue.serverTimestamp(),
      });
  } catch (error) {
    console.error('Error setting default address:', error);
    throw new Error('Failed to set default address');
  }
}
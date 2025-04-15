// Extender el objeto Window para incluir nuestra propiedad personalizada
interface Window {
  /**
   * Flag para prevenir la duplicación de tickets durante el proceso de creación/actualización
   */
  _isProcessingTicket?: boolean;
}
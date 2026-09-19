import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('trades')
export class TradeEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  tradeId!: string;

  @Index()
  @Column({ type: 'timestamptz' })
  timestamp!: Date;

  @Index()
  @Column({ type: 'varchar', length: 32 })
  exchange!: string;

  @Index()
  @Column({ type: 'varchar', length: 16 })
  symbol!: string;

  @Index()
  @Column({ type: 'varchar', length: 8 })
  side!: string;

  @Column({ type: 'numeric', precision: 28, scale: 10 })
  quantity!: string;

  @Column({ type: 'numeric', precision: 28, scale: 10 })
  priceUsd!: string;

  @Column({ type: 'numeric', precision: 28, scale: 10 })
  feeUsd!: string;
}


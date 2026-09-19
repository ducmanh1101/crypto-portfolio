import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('price_snapshots')
export class PriceSnapshotEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamptz' })
  asOf!: Date;

  @Index()
  @Column({ type: 'varchar', length: 16 })
  symbol!: string;

  @Column({ type: 'numeric', precision: 28, scale: 10 })
  priceUsd!: string;
}

